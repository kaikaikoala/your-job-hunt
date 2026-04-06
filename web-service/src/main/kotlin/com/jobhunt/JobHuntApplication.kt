package com.jobhunt

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration
import org.springframework.boot.runApplication

@SpringBootApplication(exclude = [UserDetailsServiceAutoConfiguration::class])
class JobHuntApplication

fun main(args: Array<String>) {
    runApplication<JobHuntApplication>(*args)
}
