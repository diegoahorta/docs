package com.oducreative.reader

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.oducreative.reader.app.MainActivity
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class MainActivityUiTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()

    private fun s(id: Int) = rule.activity.getString(id)

    @Test fun navigatesBetweenMainScreens() {
        rule.onAllNodesWithText(s(R.string.nav_library)).onFirst().assertIsDisplayed()
        rule.onNodeWithText(s(R.string.nav_study)).performClick()
        rule.onNodeWithText("ODU Study Tools").assertIsDisplayed()
        rule.onNodeWithText(s(R.string.nav_dashboard)).performClick()
        rule.onNodeWithText("Painel de leitura").assertIsDisplayed()
        rule.onNodeWithText(s(R.string.nav_annotations)).performClick()
        rule.onNodeWithText("Anotações e marcadores").assertIsDisplayed()
    }
}
