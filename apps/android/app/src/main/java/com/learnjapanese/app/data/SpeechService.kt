package com.learnjapanese.app.data

import android.content.Context
import android.speech.tts.TextToSpeech
import java.util.Locale

class SpeechService(
    context: Context,
) : TextToSpeech.OnInitListener {
    private val tts: TextToSpeech = TextToSpeech(context.applicationContext, this)
    private var ready = false

    override fun onInit(status: Int) {
        ready = status == TextToSpeech.SUCCESS
        if (ready) {
            tts.language = Locale.JAPAN
        }
    }

    fun speak(text: String) {
        if (!ready || text.isBlank()) return
        tts.stop()
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "learnjapanese-utterance")
    }

    fun shutdown() {
        tts.stop()
        tts.shutdown()
    }
}
