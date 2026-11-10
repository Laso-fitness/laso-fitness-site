"""Original procedural sound effects; no external recordings or model assets."""
from pathlib import Path
import numpy as np
from scipy.signal import butter,sosfilt
import wave,subprocess
root=Path(__file__).resolve().parents[2]/'private-invitation/audio';root.mkdir(parents=True,exist_ok=True)
sr=22050;rng=np.random.default_rng(20261110)
def band(x,lo,hi):return sosfilt(butter(3,[lo,hi],btype='bandpass',fs=sr,output='sos'),x)
def save(name,x):
 x=np.tanh(x);x=x/max(np.max(np.abs(x)),1e-9)*.72
 x[:220]*=np.linspace(0,1,220);x[-220:]*=np.linspace(1,0,220)
 p=root/(name+'.wav')
 with wave.open(str(p),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((x*32767).astype('<i2').tobytes())
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(p),'-ac','1','-ar',str(sr),'-c:a','libmp3lame','-b:a','40k','-y',str(root/(name+'.mp3'))],check=True);p.unlink()
# Short scrape followed by ignition; total under one second.
t=np.arange(int(.65*sr))/sr
scrape=band(rng.normal(size=len(t)),450,6500)*(np.sin(np.pi*np.clip(t/.25,0,1))**2)*(t<.25)
ignite=band(rng.normal(size=len(t)),180,4800)*np.exp(-np.maximum(0,t-.19)*10)*(t>.19)
save('match-strike',scrape*.65+ignite*.5)
# Periodic colored bed plus scattered, damped pops. Endpoints fade over 10 ms.
n=sr*6;t=np.arange(n)/sr
freq=np.fft.rfftfreq(n,1/sr);spec=(rng.normal(size=len(freq))+1j*rng.normal(size=len(freq)))/np.maximum(freq,30)**.7
bed=np.fft.irfft(spec,n);bed=bed/(np.std(bed)+1e-9)*.04
for _ in range(66):
 length=int(rng.uniform(.012,.095)*sr);tt=np.arange(length)/sr
 pop=band(rng.normal(size=length),450,6500)*np.exp(-tt/rng.uniform(.005,.02))*rng.uniform(.12,.5)
 pos=int(rng.integers(n));indices=(pos+np.arange(length))%n;bed[indices]+=pop
save('fire-crackle',bed)
# One sharp crack and a falling low-frequency tail; controlled peak level.
t=np.arange(int(1.8*sr))/sr
crack=band(rng.normal(size=len(t)),500,8500)*np.exp(-t*35)
rumble=band(rng.normal(size=len(t)),45,700)*np.exp(-t*2.7)
roll=.14*np.sin(2*np.pi*(54*t-7*t*t))*np.exp(-t*3)
save('thunder-crack',crack*.9+rumble*.65+roll)
print([(p.name,p.stat().st_size) for p in root.glob('*.mp3')])
