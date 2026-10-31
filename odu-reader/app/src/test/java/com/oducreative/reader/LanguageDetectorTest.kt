package com.oducreative.reader

import com.oducreative.reader.core.utilities.LanguageDetector
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class LanguageDetectorTest {
    @Test fun detectsScripts() {
        assertEquals("ja", LanguageDetector.detect("これは日本語の文章です。ひらがなとカタカナがあります。"))
        assertEquals("ko", LanguageDetector.detect("이것은 한국어 문장입니다. 오늘은 날씨가 좋아요."))
        assertEquals("zh", LanguageDetector.detect("这是一个中文句子，我们今天去图书馆看书。"))
    }

    @Test fun detectsLatinLanguages() {
        assertEquals("en", LanguageDetector.detect("The quick brown fox jumps over the lazy dog and it is not tired."))
        assertEquals("pt", LanguageDetector.detect("Você não sabe que a leitura é uma das coisas mais importantes para nós."))
        assertEquals("es", LanguageDetector.detect("El niño está en la escuela y aprende muy rápido con los libros, ¿verdad?"))
        assertEquals("fr", LanguageDetector.detect("Le petit prince est un livre que nous avons lu dans la classe avec vous."))
        assertEquals("de", LanguageDetector.detect("Der Hund ist nicht im Haus und die Katze schläft auf dem Sofa."))
    }

    @Test fun emptyReturnsNull() {
        assertNull(LanguageDetector.detect(""))
    }
}
