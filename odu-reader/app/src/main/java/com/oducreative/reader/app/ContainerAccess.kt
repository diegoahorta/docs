package com.oducreative.reader.app

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

val Context.appContainer: AppContainer get() = (applicationContext as OduReaderApp).container

@Composable
fun appContainer(): AppContainer = LocalContext.current.appContainer
