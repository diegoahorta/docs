package com.oducreative.reader

import com.oducreative.reader.core.utilities.FileSniffer
import com.oducreative.reader.data.models.BookFormat
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class FileSnifferTest {
    @Test fun pdfHeader() {
        assertEquals(BookFormat.PDF, FileSniffer.sniffHeader("%PDF-1.7\n...".toByteArray()))
    }

    @Test fun unknownHeader() {
        assertNull(FileSniffer.sniffHeader("hello world".toByteArray()))
        assertNull(FileSniffer.sniffHeader(ByteArray(0)))
    }

    @Test fun epubRequiresContainer() {
        val good = File.createTempFile("good", ".epub")
        ZipOutputStream(good.outputStream()).use { z ->
            z.putNextEntry(ZipEntry("mimetype")); z.write("application/epub+zip".toByteArray()); z.closeEntry()
            z.putNextEntry(ZipEntry("META-INF/container.xml")); z.write("<container/>".toByteArray()); z.closeEntry()
        }
        val bad = File.createTempFile("bad", ".zip")
        ZipOutputStream(bad.outputStream()).use { z -> z.putNextEntry(ZipEntry("a.txt")); z.write(1); z.closeEntry() }
        assertTrue(FileSniffer.isValidEpub(good))
        assertEquals(BookFormat.EPUB, FileSniffer.sniff(good))
        assertFalse(FileSniffer.isValidEpub(bad))
        assertNull(FileSniffer.sniff(bad))
        good.delete(); bad.delete()
    }

    @Test fun corruptedFileIsRejected() {
        val f = File.createTempFile("corrupt", ".pdf")
        f.writeBytes(ByteArray(2048) { (it % 7).toByte() })
        assertNull(FileSniffer.sniff(f))
        f.delete()
    }
}
