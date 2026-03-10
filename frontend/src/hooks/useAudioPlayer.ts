import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioPlayerOptions {
    onEnded?: (duration: number) => void;
    onTimeUpdate?: (currentTime: number) => void;
}

export function useAudioPlayer({ onEnded, onTimeUpdate }: UseAudioPlayerOptions = {}) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRateState] = useState(1);
    const startTimeRef = useRef<number>(0);

    const getAudio = useCallback(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }
        return audioRef.current;
    }, []);

    const load = useCallback((url: string) => {
        const audio = getAudio();
        audio.src = url;
        audio.load();
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
    }, [getAudio]);

    const play = useCallback(async () => {
        const audio = getAudio();
        try {
            await audio.play();
            startTimeRef.current = Date.now();
            setIsPlaying(true);
        } catch (e) {
            console.warn('Audio play failed:', e);
        }
    }, [getAudio]);

    const pause = useCallback(() => {
        getAudio().pause();
        setIsPlaying(false);
    }, [getAudio]);

    const seek = useCallback((time: number) => {
        const audio = getAudio();
        audio.currentTime = time;
        setCurrentTime(time);
    }, [getAudio]);

    const setPlaybackRate = useCallback((rate: number) => {
        const audio = getAudio();
        audio.playbackRate = rate;
        setPlaybackRateState(rate);
    }, [getAudio]);

    const rewind = useCallback((seconds = 10) => {
        const audio = getAudio();
        audio.currentTime = Math.max(0, audio.currentTime - seconds);
    }, [getAudio]);

    const forward = useCallback((seconds = 10) => {
        const audio = getAudio();
        audio.currentTime = Math.min(audio.duration, audio.currentTime + seconds);
    }, [getAudio]);

    // Fallback TTS khi không có audio file
    const speakTTS = useCallback((text: string, lang = 'vi-VN') => {
        if (!('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = playbackRate;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
        utterance.onend = () => {
            setIsPlaying(false);
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            onEnded?.(elapsed);
        };
    }, [playbackRate, onEnded]);

    useEffect(() => {
        const audio = getAudio();

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            onTimeUpdate?.(audio.currentTime);
        };
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            onEnded?.(elapsed);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
        };
    }, [getAudio, onEnded, onTimeUpdate]);

    return {
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        load,
        play,
        pause,
        seek,
        rewind,
        forward,
        setPlaybackRate,
        speakTTS,
    };
}
