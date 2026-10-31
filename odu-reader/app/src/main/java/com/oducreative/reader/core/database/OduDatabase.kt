package com.oducreative.reader.core.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.oducreative.reader.data.models.AnnotationEntity
import com.oducreative.reader.data.models.BookCollectionCrossRef
import com.oducreative.reader.data.models.BookEntity
import com.oducreative.reader.data.models.BookmarkEntity
import com.oducreative.reader.data.models.CollectionEntity
import com.oducreative.reader.data.models.FlashcardEntity
import com.oducreative.reader.data.models.GrammarPatternEntity
import com.oducreative.reader.data.models.ReadingSessionEntity

@Database(
    entities = [
        BookEntity::class,
        CollectionEntity::class,
        BookCollectionCrossRef::class,
        BookmarkEntity::class,
        AnnotationEntity::class,
        FlashcardEntity::class,
        GrammarPatternEntity::class,
        ReadingSessionEntity::class,
    ],
    version = 1,
    exportSchema = true,
)
@TypeConverters(Converters::class)
abstract class OduDatabase : RoomDatabase() {
    abstract fun bookDao(): BookDao
    abstract fun collectionDao(): CollectionDao
    abstract fun bookmarkDao(): BookmarkDao
    abstract fun annotationDao(): AnnotationDao
    abstract fun studyDao(): StudyDao
    abstract fun sessionDao(): SessionDao

    companion object {
        const val NAME = "odu_reader.db"

        fun build(context: Context): OduDatabase =
            Room.databaseBuilder(context, OduDatabase::class.java, NAME).build()
    }
}
