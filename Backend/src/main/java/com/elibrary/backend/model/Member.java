package com.elibrary.backend.model;

import java.time.LocalDate;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("members")
public record Member(
        long memberId,
        String fullName,
        String status,
        String membershipType,
        String mobile,
        String email,
        LocalDate joinedOn,
        LocalDate validUntil
) {
}
