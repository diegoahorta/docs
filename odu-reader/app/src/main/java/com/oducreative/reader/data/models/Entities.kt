package com.oducreative.reader.data.models

import androidx.room.Embedded
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.Junction
import androidx.room.PrimaryKey
import androidx.room.Relation

enum class BookFormat { PDF, EPUB }

/**
 * Livro ou documento importado. O arquivo é copiado para o armazenamento privado do app
 * ([filePath]); o arquivo original do usuário nunca é alterado nem excluído.
 *
 * [position] guarda a âncora de leitura adequada ao formato:
 *  - PDF: índice da página (base 0) em texto, ex.: "12"
 *  - EPUB: JSON de um Locator do Readium
 */
@Entity(tableName = "books", indices = [Index("contentHash", unique = true)])
data class BookEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val customTitle: String? = null,
    val author: String? = null,
    val format: BookFormat,
    val filePath: String,
    val originalFileName: String,
    val coverPath: String? = null,
    val fileSize: Long,
    val contentHash: String,
    val language: String? = null,
    val totalPages: Int = 0,
    val position: String? = null,
    val progress: Float = 0f,
    val isFavorite: Boolean = false,
    val isCompleted: Boolean = false,
    val addedAt: Long = System.currentTimeMillis(),
    val lastOpenedAt: Long? = null,
    val completedAt: Long? = null,
) {
    val displayTitle: String get() = customTitle?.takeIf { it.isNotBlank() } ?: title
}

@Entity(tableName = "collections")
data class CollectionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val createdAt: Long = System.currentTimeMillis(),
)

@Entity(
    tableName = "book_collection",
    primaryKeys = ["bookId", "collectionId"],
    foreignKeys = [
        ForeignKey(BookEntity::class, ["id"], ["bookId"], onDelete = ForeignKey.CASCADE),
        ForeignKey(CollectionEntity::class, ["id"], ["collectionId"], onDelete = ForeignKey.CASCADE),
    ],
    indices = [Index("collectionId")]
)
data class BookCollectionCrossRef(val bookId: Long, val collectionId: Long)

data class CollectionWithBooks(
    @Embedded val collection: CollectionEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "id",
        associateBy = Junction(BookCollectionCrossRef::class, parentColumn = "collectionId", entityColumn = "bookId")
    )
    val books: List<BookEntity>,
)

@Entity(
    tableName = "bookmarks",
    foreignKeys = [ForeignKey(BookEntity::class, ["id"], ["bookId"], onDelete = ForeignKey.CASCADE)],
    indices = [Index("bookId")]
)
data class BookmarkEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val bookId: Long,
    /** Página (PDF) ou Locator JSON (EPUB). */
    val locator: String,
    val page: Int? = null,
    val label: String,
    val progress: Float = 0f,
    val createdAt: Long = System.currentTimeMillis(),
)

enum class AnnotationType { HIGHLIGHT, NOTE }

/** Cores de destaque (ARGB). */
object HighlightColors {
    const val YELLOW = 0xFFFFE066.toInt()
    const val GREEN = 0xFF8CE99A.toInt()
    const val BLUE = 0xFF74C0FC.toInt()
    const val PINK = 0xFFFAA2C1.toInt()
    const val ORANGE = 0xFFFFC078.toInt()
    val all = listOf(YELLOW, GREEN, BLUE, PINK, ORANGE)
}

@Entity(
    tableName = "annotations",
    foreignKeys = [ForeignKey(BookEntity::class, ["id"], ["bookId"], onDelete = ForeignKey.CASCADE)],
    indices = [Index("bookId")]
)
data class AnnotationEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val bookId: Long,
    val type: AnnotationType,
    /** Página (PDF) ou Locator JSON (EPUB). */
    val locator: String,
    val page: Int? = null,
    val chapter: String? = null,
    val selectedText: String = "",
    val note: String = "",
    val color: Int = HighlightColors.YELLOW,
    /** true quando o texto veio de OCR e não da camada de texto original do PDF. */
    val fromOcr: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
)

data class AnnotationWithBook(
    @Embedded val annotation: AnnotationEntity,
    @Relation(parentColumn = "bookId", entityColumn = "id") val book: BookEntity?,
)

data class BookmarkWithBook(
    @Embedded val bookmark: BookmarkEntity,
    @Relation(parentColumn = "bookId", entityColumn = "id") val book: BookEntity?,
)

@Entity(tableName = "flashcards", indices = [Index("bookId"), Index("dueAt")])
data class FlashcardEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val bookId: Long? = null,
    val front: String,
    val back: String,
    val context: String = "",
    val bookTitle: String? = null,
    val locator: String? = null,
    val page: Int? = null,
    val language: String? = null,
    /** Repetição espaçada (SM-2 simplificado). */
    val intervalDays: Int = 0,
    val ease: Float = 2.5f,
    val repetitions: Int = 0,
    val dueAt: Long = System.currentTimeMillis(),
    val markedForReview: Boolean = true,
    val createdAt: Long = System.currentTimeMillis(),
)

/** Área "Discover the Pattern — Grammar Rule". */
@Entity(tableName = "grammar_patterns")
data class GrammarPatternEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    /** Frases observadas, separadas por quebra de linha. */
    val examples: String,
    val hypothesis: String = "",
    val explanation: String = "",
    val explanationRevealed: Boolean = false,
    val bookId: Long? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
)

/**
 * Sessão efetiva de leitura. [activeMillis] soma apenas períodos com interação recente
 * (ver ReadingSessionTracker), não o tempo total com o app aberto.
 */
@Entity(
    tableName = "reading_sessions",
    foreignKeys = [ForeignKey(BookEntity::class, ["id"], ["bookId"], onDelete = ForeignKey.CASCADE)],
    indices = [Index("bookId"), Index("startedAt")]
)
data class ReadingSessionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val bookId: Long,
    val startedAt: Long,
    val endedAt: Long,
    val activeMillis: Long,
    val startProgress: Float,
    val endProgress: Float,
)

data class DailyReading(val day: String, val totalMillis: Long)
