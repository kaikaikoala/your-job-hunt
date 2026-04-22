package com.jobhunt

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface UserRepository : JpaRepository<User, UUID> {
    fun findByFirebaseUid(firebaseUid: String): User?

    @Modifying
    @Query(value = "INSERT INTO users (firebase_uid) VALUES (:firebaseUid) ON CONFLICT DO NOTHING", nativeQuery = true)
    fun upsertByFirebaseUid(@Param("firebaseUid") firebaseUid: String)
}
