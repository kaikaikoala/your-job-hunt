package com.jobhunt

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "action_items")
class ActionItem(
    @Id
    @Column(name = "action_item_id")
    val actionItemId: UUID = UUID.randomUUID(),

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "app_id")
    val appId: UUID? = null,

    @Column(name = "referrer_id")
    val referrerId: UUID? = null,

    @Column(nullable = false)
    val description: String,

    @Column(nullable = false)
    val status: String = "open",

    @Column(name = "due_date")
    val dueDate: LocalDate? = null,

    @Column(name = "create_date", nullable = false, updatable = false)
    val createDate: Instant = Instant.now(),
)
