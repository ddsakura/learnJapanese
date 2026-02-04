package com.learnjapanese.app.ui.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors: ColorScheme =
    lightColorScheme(
        primary = Color(0xFF2F6BFF),
        secondary = Color(0xFF4E8BFF),
        surface = Color(0xFFF7F7F9),
        background = Color(0xFFF7F7F9),
        onPrimary = Color.White,
        onSecondary = Color.White,
        onSurface = Color(0xFF1B1B1F),
        onBackground = Color(0xFF1B1B1F),
    )

private val DarkColors: ColorScheme =
    darkColorScheme(
        primary = Color(0xFF8FB1FF),
        secondary = Color(0xFF9BC0FF),
        surface = Color(0xFF111318),
        background = Color(0xFF0D0F14),
        onPrimary = Color(0xFF0B1533),
        onSecondary = Color(0xFF0B1533),
        onSurface = Color(0xFFE4E1E6),
        onBackground = Color(0xFFE4E1E6),
    )

@Composable
fun LearnJapaneseTheme(
    darkTheme: Boolean,
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content,
    )
}
