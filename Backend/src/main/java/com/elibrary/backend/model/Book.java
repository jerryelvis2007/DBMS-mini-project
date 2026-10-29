package com.elibrary.backend.model;

import org.springframework.data.mongodb.core.mapping.Document;

@Document("books")
public record Book(
        long bookId,
        String title,
        String author,
        String category,
        int availableCopies
) {
}
