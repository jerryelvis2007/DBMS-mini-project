package com.elibrary.backend.controller;

import com.elibrary.backend.model.Book;
import com.elibrary.backend.model.Borrowing;
import com.elibrary.backend.model.IssueBookRequest;
import com.elibrary.backend.model.Member;
import com.elibrary.backend.service.LibraryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LibraryController {

    private final LibraryService libraryService;

    public LibraryController(LibraryService libraryService) {
        this.libraryService = libraryService;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }

    @GetMapping("/dashboard")
    public LibraryService.Dashboard dashboard() {
        return libraryService.dashboard();
    }

    @GetMapping("/books")
    public List<Book> books(@RequestParam(defaultValue = "") String search) {
        return libraryService.findBooks(search);
    }

    @GetMapping("/members")
    public List<Member> members(@RequestParam(defaultValue = "") String search) {
        return libraryService.findMembers(search);
    }

    @GetMapping("/members/{memberId}/borrowings")
    public List<Borrowing> borrowings(@PathVariable long memberId) {
        return libraryService.findBorrowings(memberId);
    }

    @PostMapping("/borrowings")
    public ResponseEntity<Map<String, Object>> issueBook(@Valid @RequestBody IssueBookRequest request) {
        Borrowing borrowing = libraryService.issueBook(request);
        return ResponseEntity.ok(Map.of(
                "message", "Book issued successfully",
                "borrowing", borrowing
        ));
    }
}
