package com.learnjapanese.app.data

import android.content.Context
import android.media.AudioAttributes
import android.speech.tts.TextToSpeech
import java.util.Locale

enum class SpeechStatus {
    INITIALIZING,
    READY_JAPANESE,
    READY_NON_JAPANESE,
    FAILED,
}

class SpeechService(
    context: Context,
) : TextToSpeech.OnInitListener {
    private val tts: TextToSpeech = TextToSpeech(context.applicationContext, this)
    private var ready = false
    private var pendingText: String? = null
    private var status: SpeechStatus = SpeechStatus.INITIALIZING

    override fun onInit(status: Int) {
        ready = status == TextToSpeech.SUCCESS
        if (!ready) {
            this.status = SpeechStatus.FAILED
            return
        }

        tts.setAudioAttributes(
            AudioAttributes
                .Builder()
                .setUsage(AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build(),
        )

        var hasJapanese = false
        for (locale in listOf(Locale.JAPAN, Locale("ja", "JP"))) {
            val result = tts.setLanguage(locale)
            if (result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED) {
                hasJapanese = true
                break
            }
        }
        if (!hasJapanese) {
            // Keep TTS usable, but caller should treat this as non-Japanese fallback.
            tts.setLanguage(Locale.getDefault())
            this.status = SpeechStatus.READY_NON_JAPANESE
        } else {
            this.status = SpeechStatus.READY_JAPANESE
        }

        pendingText?.let {
            pendingText = null
            speak(it)
        }
    }

    fun speak(text: String) {
        if (text.isBlank()) return
        if (!ready) {
            pendingText = text
            return
        }
        tts.stop()
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "learnjapanese-utterance")
    }

    fun currentStatus(): SpeechStatus = status

    fun shutdown() {
        tts.stop()
        tts.shutdown()
    }
}
