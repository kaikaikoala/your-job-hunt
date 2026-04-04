package com.jobhunt

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class JobHuntApplication

fun main(args: Array<String>) {
    runApplication<JobHuntApplication>(*args)
}
