package com.jobhunt

import jakarta.transaction.Transactional
import org.springframework.stereotype.Service

@Service
class UserService(private val userRepo: UserRepository) {

    @Transactional
    fun findOrCreate(firebaseUid: String): User {
        userRepo.upsertByFirebaseUid(firebaseUid)
        return userRepo.findByFirebaseUid(firebaseUid)!!
    }
}
