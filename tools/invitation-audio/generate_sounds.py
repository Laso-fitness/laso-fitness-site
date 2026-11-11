"""Original procedural sound effects; no external recordings or model assets."""
from pathlib import Path
import numpy as np
from scipy.signal import butter,sosfilt
import wave,subprocess
root=Path(__file__).resolve().parents[2]/'private-invitation/audio';root.mkdir(parents=True,exist_ok=True)
sr=22050;rng=np.random.default_rng(20261110)
def band(x,lo,hi):return sosfilt(butter(3,[lo,hi],btype='bandpass',fs=sr,output='sos'),x)
def save(name,x,peak=.72):
 x=np.tanh(x);x=x/max(np.max(np.abs(x)),1e-9)*peak
 x[:220]*=np.linspace(0,1,220);x[-220:]*=np.linspace(1,0,220)
 p=root/(name+'.wav')
 with wave.open(str(p),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((x*32767).astype('<i2').tobytes())
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(p),'-ac','1','-ar',str(sr),'-c:a','libmp3lame','-b:a','40k','-y',str(root/(name+'.mp3'))],check=True);p.unlink()
# Revised match: dry contact, textured rasp, then a distinct ignition bloom.
# Length stays exactly .65 seconds, preserving the existing fire-start cue.
rng=np.random.default_rng(20261111)
t=np.arange(int(.65*sr))/sr
contact=band(rng.normal(size=len(t)),1100,8500)*np.exp(-np.maximum(0,t-.012)*190)*(t>=.012)
rasp_env=(np.sin(np.pi*np.clip((t-.025)/.205,0,1))**1.1)*(t>.025)*(t<.23)
texture=.65+.22*np.sin(2*np.pi*73*t)+.13*np.sin(2*np.pi*137*t)
rasp=band(rng.normal(size=len(t)),700,6500)*rasp_env*texture
ignite_t=np.maximum(0,t-.205)
ignite_env=(1-np.exp(-ignite_t*100))*np.exp(-ignite_t*13)*(t>=.205)
ignite=band(rng.normal(size=len(t)),170,3600)*ignite_env
wood=(np.sin(2*np.pi*1470*t)+.35*np.sin(2*np.pi*2820*t))*np.exp(-np.maximum(0,t-.012)*220)*(t>=.012)
save('match-strike',contact*.85+rasp*.8+ignite*.9+wood*.09,peak=.84)
# Preserve the original crackle byte-for-byte by retaining its original RNG stream.
rng=np.random.default_rng(20261110)
rng.normal(size=int(.65*sr));rng.normal(size=int(.65*sr))
# Periodic colored bed plus scattered, damped pops. Endpoints fade over 10 ms.
n=sr*6;t=np.arange(n)/sr
freq=np.fft.rfftfreq(n,1/sr);spec=(rng.normal(size=len(freq))+1j*rng.normal(size=len(freq)))/np.maximum(freq,30)**.7
bed=np.fft.irfft(spec,n);bed=bed/(np.std(bed)+1e-9)*.04
for _ in range(66):
 length=int(rng.uniform(.012,.095)*sr);tt=np.arange(length)/sr
 pop=band(rng.normal(size=length),450,6500)*np.exp(-tt/rng.uniform(.005,.02))*rng.uniform(.12,.5)
 pos=int(rng.integers(n));indices=(pos+np.arange(length))%n;bed[indices]+=pop
save('fire-crackle',bed)
# Revised thunder: one impact with a fuller mid-bass body and longer rolling tail.
# Still a single cue at the first visible lightning frame, not repeated strikes.
rng=np.random.default_rng(20261112)
t=np.arange(int(2.95*sr))/sr
crack=band(rng.normal(size=len(t)),650,8500)*np.exp(-t*48)
fracture=band(rng.normal(size=len(t)),380,5200)*(np.exp(-np.maximum(0,t-.032)*48)*(t>=.032)+.45*np.exp(-np.maximum(0,t-.086)*55)*(t>=.086))
body=band(rng.normal(size=len(t)),90,1200)*np.exp(-t*3.6)
rumble=band(rng.normal(size=len(t)),48,520)*np.exp(-t*1.65)*( .7+.3*np.sin(2*np.pi*2.1*t)**2 )
roll=.13*(np.sin(2*np.pi*73*t)+.45*np.sin(2*np.pi*119*t))*np.exp(-t*2.1)
save('thunder-crack',crack*.9+fracture*.48+body*1.1+rumble*.9+roll,peak=.65)
print([(p.name,p.stat().st_size) for p in root.glob('*.mp3')])
