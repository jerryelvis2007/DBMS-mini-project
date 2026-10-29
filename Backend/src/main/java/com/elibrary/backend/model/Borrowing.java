package com.elibrary.backend.model;

import java.time.LocalDate;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("borrowings")
public record Borrowing(
        long memberId,
        long bookId,
        String title,
        String author,
        LocalDate issueDate,
        LocalDate dueDate,
        String status
) {
}
