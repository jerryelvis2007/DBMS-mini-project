package com.elibrary.backend.service;

import com.elibrary.backend.model.Book;
import com.elibrary.backend.model.Borrowing;
import com.elibrary.backend.model.IssueBookRequest;
import com.elibrary.backend.model.Member;
import jakarta.annotation.PostConstruct;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class LibraryService {

    private final MongoTemplate mongoTemplate;

    public LibraryService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @PostConstruct
    void seedSampleData() {
        if (mongoTemplate.count(new Query(), Book.class) == 0) {
            mongoTemplate.insertAll(List.of(
                    new Book(1, "Clean Code", "Robert C. Martin", "Programming", 3),
                    new Book(2, "The Pragmatic Programmer", "Andrew Hunt", "Programming", 2),
                    new Book(3, "Atomic Habits", "James Clear", "Self-help", 4)
            ));
        }

        if (mongoTemplate.count(new Query(), Member.class) == 0) {
            mongoTemplate.insertAll(List.of(
                    new Member(101, "Aarav Sharma", "ACTIVE", "Regular", "9876543210", "aarav@example.com", LocalDate.now().minusMonths(8), LocalDate.now().plusMonths(4)),
                    new Member(102, "Diya Patel", "ACTIVE", "Premium", "9876501234", "diya@example.com", LocalDate.now().minusMonths(5), LocalDate.now().plusMonths(7)),
                    new Member(103, "Rohan Kumar", "INACTIVE", "Regular", "9876512345", "rohan@example.com", LocalDate.now().minusYears(2), LocalDate.now().minusMonths(1))
            ));
        }
    }

    public List<Book> findBooks(String search) {
        String query = normalize(search);
        if (query.isBlank()) {
            return mongoTemplate.findAll(Book.class);
        }

        Pattern pattern = Pattern.compile(Pattern.quote(query), Pattern.CASE_INSENSITIVE);
        Query bookQuery = new Query(new Criteria().orOperator(
                Criteria.where("title").regex(pattern),
                Criteria.where("author").regex(pattern)
        ));
        return mongoTemplate.find(bookQuery, Book.class);
    }

    public List<Member> findMembers(String search) {
        String query = normalize(search);
        if (query.isBlank()) {
            return mongoTemplate.findAll(Member.class);
        }

        Criteria nameCriteria = Criteria.where("fullName").regex(Pattern.quote(query), "i");
        Criteria criteria;
        try {
            criteria = new Criteria().orOperator(
                    Criteria.where("memberId").is(Long.parseLong(query)),
                    nameCriteria
            );
        } catch (NumberFormatException ignored) {
            criteria = nameCriteria;
        }
        return mongoTemplate.find(new Query(criteria), Member.class);
    }

    public List<Borrowing> findBorrowings(long memberId) {
        return mongoTemplate.find(
                Query.query(Criteria.where("memberId").is(memberId)),
                Borrowing.class
        );
    }

    public synchronized Borrowing issueBook(IssueBookRequest request) {
        if (request.dueDate().isBefore(request.issueDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Due date cannot be earlier than issue date");
        }

        Member member = mongoTemplate.findOne(
                Query.query(Criteria.where("memberId").is(request.memberId())),
                Member.class
        );
        if (member == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found");
        }
        if (!"ACTIVE".equalsIgnoreCase(member.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only active members can borrow books");
        }

        Book book = mongoTemplate.findOne(
                Query.query(Criteria.where("bookId").is(request.bookId())),
                Book.class
        );
        if (book == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found");
        }
        if (book.availableCopies() < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No copies of this book are available");
        }

        mongoTemplate.updateFirst(
                Query.query(Criteria.where("bookId").is(book.bookId()).and("availableCopies").gt(0)),
                new Update().inc("availableCopies", -1),
                Book.class
        );

        Borrowing borrowing = new Borrowing(
                member.memberId(),
                book.bookId(),
                book.title(),
                book.author(),
                request.issueDate(),
                request.dueDate(),
                "BORROWED"
        );
        return mongoTemplate.insert(borrowing);
    }

    public Dashboard dashboard() {
        LocalDate soon = LocalDate.now().plusDays(7);
        long totalMembers = mongoTemplate.count(new Query(), Member.class);
        long totalBooks = mongoTemplate.count(new Query(), Book.class);
        long currentlyBorrowed = mongoTemplate.count(
                Query.query(Criteria.where("status").is("BORROWED")),
                Borrowing.class
        );
        long dueSoon = mongoTemplate.count(
                Query.query(new Criteria().andOperator(
                        Criteria.where("status").is("BORROWED"),
                        Criteria.where("dueDate").lte(soon)
                )),
                Borrowing.class
        );
        return new Dashboard(totalMembers, totalBooks, currentlyBorrowed, dueSoon);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    public record Dashboard(long totalMembers, long totalBooks, long currentlyBorrowed, long dueSoon) {
    }
}
