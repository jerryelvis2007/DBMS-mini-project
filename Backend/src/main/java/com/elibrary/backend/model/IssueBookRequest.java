package com.elibrary.backend.model;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record IssueBookRequest(
        @NotNull Long memberId,
        @NotNull Long bookId,
        @NotNull LocalDate issueDate,
        @NotNull LocalDate dueDate
) {
}
