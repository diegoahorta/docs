package com.oducreative.reader.core.database

import androidx.room.TypeConverter
import com.oducreative.reader.data.models.AnnotationType
import com.oducreative.reader.data.models.BookFormat

class Converters {
    @TypeConverter fun formatToString(f: BookFormat): String = f.name
    @TypeConverter fun stringToFormat(s: String): BookFormat = BookFormat.valueOf(s)
    @TypeConverter fun typeToString(t: AnnotationType): String = t.name
    @TypeConverter fun stringToType(s: String): AnnotationType = AnnotationType.valueOf(s)
}
