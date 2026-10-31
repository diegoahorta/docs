# Readium
-keep class org.readium.** { *; }
-dontwarn org.readium.**
# PdfBox-Android
-keep class com.tom_roush.pdfbox.** { *; }
-dontwarn com.tom_roush.**
-dontwarn com.gemalto.jp2.**
-dontwarn org.bouncycastle.**
# Room
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *
# Anthropic Java SDK (Jackson + Kotlin reflection)
-keep class com.anthropic.** { *; }
-dontwarn com.anthropic.**
-keep class com.fasterxml.jackson.** { *; }
-dontwarn com.fasterxml.jackson.**
-keep class kotlin.Metadata { *; }
-keep class kotlin.reflect.** { *; }
-dontwarn io.opentelemetry.**
-dontwarn com.standardwebhooks.**
-dontwarn io.swagger.**
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn java.beans.**
