
class AlertService {
  private audioContext: AudioContext | null = null
  private lastAlertTime: number = 0
  private repeatInterval: number = 5000

  constructor() {

  }

  private initAudio() {
    if (!this.audioContext) {
      // @ts-expect-error - Soporte para navegadores antiguos con webkitAudioContext
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      this.audioContext = new AudioContextClass()
    }
  }

  private playBeep(volume: number) {
    try {
      this.initAudio()
      if (!this.audioContext) return

      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      const safeVolume = Math.max(0.01, Math.min(1, volume / 100))
      gainNode.gain.setValueAtTime(safeVolume, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.3)
      
      setTimeout(() => {
        oscillator.disconnect()
        gainNode.disconnect()
      }, 400)
    } catch (error) {
      console.error('Error reproduciendo beep:', error)
    }
  }

  trigger(type: 'visual' | 'sound' | 'both', volume: number, repeatIntervalSeconds: number) {
    try {
      const now = Date.now()
      this.repeatInterval = repeatIntervalSeconds * 1000

      if (now - this.lastAlertTime < this.repeatInterval) {
        return false 
      }

      this.lastAlertTime = now

      if (type === 'sound' || type === 'both') {
        this.playBeep(volume)
      }

      return true
    } catch (error) {
      console.error('Error en trigger de alerta:', error)
      return false
    }
  }

  reset() {
    this.lastAlertTime = 0
  }
}

export const alertService = new AlertService()
