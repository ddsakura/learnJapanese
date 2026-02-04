package com.learnjapanese.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import com.learnjapanese.app.ui.AppViewModel
import com.learnjapanese.app.ui.ContentScreen
import com.learnjapanese.app.ui.theme.LearnJapaneseTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LearnJapaneseTheme(darkTheme = isSystemInDarkTheme()) {
                AppRoot()
            }
        }
    }
}

@Composable
private fun AppRoot() {
    val viewModel: AppViewModel = viewModel()
    ContentScreen(viewModel = viewModel)
}
