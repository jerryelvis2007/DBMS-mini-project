
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let cachedBooks = [];
let cachedMembers = [];

// Display a message to the user
function showNotice(message, type = "info") {
    const notice = $("#notice");

    notice.textContent = message;
    notice.className = `notice ${type}`;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function hideNotice() {
    $("#notice").classList.add("hidden");
}

// Prevent database text from being interpreted as HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

// Format dates for display
function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value).slice(0, 10);
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

// Style borrowing status
function statusClass(status, dueDate) {
    const value = String(status || "").toUpperCase();

    if (value === "RETURNED") {
        return "status-returned";
    }

    if (value === "BORROWED") {
        if (dueDate) {
            const due = new Date(dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (!Number.isNaN(due.getTime()) && due < today) {
                return "status-overdue";
            }
        }

        return "status-borrowed";
    }

    if (value === "ACTIVE") {
        return "status-active";
    }

    return "status-returned";
}

// Navigate between pages
function showPage(pageName) {
    const pages = {
        dashboard: "dashboardPage",
        members: "membersPage",
        books: "booksPage",
        issue: "issuePage"
    };

    Object.values(pages).forEach(id => {
        $(`#${id}`).classList.add("hidden");
    });

    $(`#${pages[pageName] || pages.dashboard}`)
        .classList.remove("hidden");

    $$(".nav-link[data-page]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName ||
            (pageName === "issue" && button.dataset.page === "books")
        );
    });

    $("#sidebar").classList.remove("open");
    hideNotice();

    if (pageName === "dashboard") loadDashboard();
    if (pageName === "members") {
        loadMembers($("#memberSearchInput").value.trim());
    }
    if (pageName === "books") {
        loadBooks($("#bookSearchInput").value.trim());
    }
    if (pageName === "issue") loadIssueOptions();
}

// Load dashboard statistics from the backend
async function loadDashboard() {
    try {
        const data = await LibraryAPI.dashboard();

        $("#totalMembers").textContent =
            data.totalMembers ?? data.TOTAL_MEMBERS ?? data.total_members ?? 0;

        $("#totalBooks").textContent =
            data.totalBooks ?? data.TOTAL_BOOKS ?? data.total_books ?? 0;

        $("#borrowedBooks").textContent =
            data.currentlyBorrowed ?? data.CURRENTLY_BORROWED ?? data.currently_borrowed ?? 0;

        $("#dueSoon").textContent =
            data.dueSoon ?? data.DUE_SOON ?? data.due_soon ?? 0;

    } catch (error) {
        showNotice(
            `Dashboard could not load: ${error.message}`,
            "error"
        );
    }
}

// Display the books table
function renderBooks(books) {
    const body = $("#booksTableBody");

    if (!books.length) {
        body.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    No books found.
                </td>
            </tr>`;
        return;
    }

    body.innerHTML = books.map(book => {
        const id = book.bookId ?? book.BOOK_ID ?? book.book_id;
        const title = book.TITLE ?? book.title;
        const author = book.AUTHOR ?? book.author;
        const category = book.CATEGORY ?? book.category ?? "—";
        const available =
            book.availableCopies ?? book.AVAILABLE_COPIES ?? book.available_copies ?? 0;

        return `
            <tr>
                <td>${escapeHTML(id)}</td>
                <td>${escapeHTML(title)}</td>
                <td>${escapeHTML(author)}</td>
                <td>${escapeHTML(category)}</td>
                <td>${escapeHTML(available)}</td>
                <td>
                    <button
                        class="table-action"
                        data-issue-book="${escapeHTML(id)}"
                        ${Number(available) < 1 ? "disabled" : ""}
                    >
                        Issue
                    </button>
                </td>
            </tr>`;
    }).join("");

    $$("[data-issue-book]").forEach(button => {
        button.addEventListener("click", async () => {
            showPage("issue");
            await loadIssueOptions();

            $("#issueBook").value = button.dataset.issueBook;
        });
    });
}

// Fetch books from Oracle through the backend
async function loadBooks(search = "") {
    $("#booksTableBody").innerHTML = `
        <tr>
            <td colspan="6" class="empty-state">Loading books...</td>
        </tr>`;

    try {
        cachedBooks = await LibraryAPI.books(search);
        renderBooks(cachedBooks);
    } catch (error) {
        $("#booksTableBody").innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    ${escapeHTML(error.message)}
                </td>
            </tr>`;
    }
}

// Display member search results
function renderMembers(members) {
    const container = $("#memberResults");

    if (!members.length) {
        container.innerHTML = `
            <div class="panel empty-state">
                No members found. Try another name or ID.
            </div>`;

        $("#memberDetails").classList.add("hidden");
        return;
    }

    container.innerHTML = members.map(member => {
        const id = member.memberId ?? member.MEMBER_ID ?? member.member_id;
        const name = member.fullName ?? member.FULL_NAME ?? member.full_name;
        const status = member.STATUS ?? member.status ?? "Active";

        const membership =
            member.membershipType ?? member.MEMBERSHIP_TYPE ?? member.membership_type ?? "Regular";

        const mobile = member.mobile ?? member.MOBILE ?? "No mobile";
        const email = member.email ?? member.EMAIL ?? "No email";

        const joined = member.joinedOn ?? member.JOINED_ON ?? member.joined_on;
        const validUntil = member.validUntil ?? member.VALID_UNTIL ?? member.valid_until;

        return `
            <article class="panel member-card">
                <div class="avatar">♟</div>

                <div>
                    <h3>${escapeHTML(name)}</h3>

                    <div class="member-meta">
                        Member ID: ${escapeHTML(id)}
                        · ${escapeHTML(membership)}
                    </div>

                    <div class="member-contact">
                        <span>☎ ${escapeHTML(mobile)}</span>
                        <span>✉ ${escapeHTML(email)}</span>
                        <span>Joined: ${escapeHTML(formatDate(joined))}</span>
                        <span>Valid until: ${escapeHTML(formatDate(validUntil))}</span>
                    </div>
                </div>

                <span class="status-pill ${statusClass(status)}">
                    ${escapeHTML(status)}
                </span>

                <button
                    class="table-action"
                    data-member-details="${escapeHTML(id)}"
                >
                    View Borrowings
                </button>
            </article>`;
    }).join("");

    $$("[data-member-details]").forEach(button => {
        button.addEventListener("click", () => {
            loadBorrowings(button.dataset.memberDetails);
        });
    });
}

// Search members
async function loadMembers(search = "") {
    $("#memberResults").innerHTML = `
        <div class="panel empty-state">Loading members...</div>`;

    try {
        cachedMembers = await LibraryAPI.members(search);
        renderMembers(cachedMembers);
    } catch (error) {
        $("#memberResults").innerHTML = `
            <div class="panel empty-state">
                ${escapeHTML(error.message)}
            </div>`;
    }
}

// Show borrowing records for a member
async function loadBorrowings(memberId) {
    try {
        const rows = await LibraryAPI.borrowings(memberId);

        $("#memberDetails").classList.remove("hidden");

        $("#memberBorrowingCount").textContent =
            `${rows.length} record${rows.length === 1 ? "" : "s"}`;

        if (!rows.length) {
            $("#memberBorrowingsBody").innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        This member has no borrowing records.
                    </td>
                </tr>`;
        } else {
            $("#memberBorrowingsBody").innerHTML = rows.map(row => {
                const status = row.status ?? row.STATUS;
                const dueDate = row.dueDate ?? row.DUE_DATE ?? row.due_date;

                return `
                    <tr>
                        <td>${escapeHTML(row.TITLE ?? row.title)}</td>
                        <td>${escapeHTML(row.AUTHOR ?? row.author)}</td>
                        <td>${escapeHTML(formatDate(
                            row.issueDate ?? row.ISSUE_DATE ?? row.issue_date
                        ))}</td>
                        <td>${escapeHTML(formatDate(dueDate))}</td>
                        <td>
                            <span class="status-pill ${statusClass(status, dueDate)}">
                                ${escapeHTML(status)}
                            </span>
                        </td>
                    </tr>`;
            }).join("");
        }

        $("#memberDetails").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {
        showNotice(
            `Could not load borrowing records: ${error.message}`,
            "error"
        );
    }
}

// Populate the Issue Book dropdowns from the backend
async function loadIssueOptions() {
    try {
        const [members, books] = await Promise.all([
            LibraryAPI.members(),
            LibraryAPI.books()
        ]);

        cachedMembers = members;
        cachedBooks = books;

        const memberSelect = $("#issueMember");
        const bookSelect = $("#issueBook");

        const previousMember = memberSelect.value;
        const previousBook = bookSelect.value;

        memberSelect.innerHTML =
            '<option value="">Select a member</option>' +
            members
                .filter(member =>
                    String(member.status ?? member.STATUS).toUpperCase()
                    === "ACTIVE"
                )
                .map(member => {
                    const id = member.memberId ?? member.MEMBER_ID ?? member.member_id;
                    const name = member.fullName ?? member.FULL_NAME ?? member.full_name;

                    return `
                        <option value="${escapeHTML(id)}">
                            ${escapeHTML(name)} (#${escapeHTML(id)})
                        </option>`;
                }).join("");

        bookSelect.innerHTML =
            '<option value="">Select a book</option>' +
            books
                .filter(book =>
                    Number(book.availableCopies ?? book.AVAILABLE_COPIES ?? book.available_copies) > 0
                )
                .map(book => {
                    const id = book.bookId ?? book.BOOK_ID ?? book.book_id;
                    const title = book.TITLE ?? book.title;
                    const copies =
                        book.availableCopies ?? book.AVAILABLE_COPIES ?? book.available_copies;

                    return `
                        <option value="${escapeHTML(id)}">
                            ${escapeHTML(title)}
                            (${escapeHTML(copies)} available)
                        </option>`;
                }).join("");

        if ([...memberSelect.options].some(option =>
            option.value === previousMember
        )) {
            memberSelect.value = previousMember;
        }

        if ([...bookSelect.options].some(option =>
            option.value === previousBook
        )) {
            bookSelect.value = previousBook;
        }

    } catch (error) {
        showNotice(
            `Could not load issue-book options: ${error.message}`,
            "error"
        );
    }
}

// Set today's issue date and a default due date 14 days later
function setDefaultDates() {
    const today = new Date();

    const localToday = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    ).toISOString().slice(0, 10);

    const due = new Date(today);
    due.setDate(due.getDate() + 14);

    const localDue = new Date(
        due.getTime() - due.getTimezoneOffset() * 60000
    ).toISOString().slice(0, 10);

    $("#issueDate").value = localToday;
    $("#issueDate").min = localToday;

    $("#dueDate").value = localDue;
    $("#dueDate").min = localToday;
}

// LOGIN
$("#loginForm")?.addEventListener("submit", event => {
    event.preventDefault();

    const username = $("#username").value.trim();
    const password = $("#password").value;

    if (!username || !password) return;

    /*
     * DEMO ONLY:
     * This form does not validate credentials with the server.
     * Implement a real authenticated login endpoint before deployment.
     */
    $("#welcomeName").textContent = username;

    $("#loginPage").classList.add("hidden");
    $("#appShell").classList.remove("hidden");

    showPage("dashboard");

    showNotice(
        "UI preview opened. Backend authentication is not configured yet.",
        "info"
    );
});

// Contact librarian
$("#contactLibrarian")?.addEventListener("click", () => {
    alert("Please contact your library administrator for account access.");
});

// LOGOUT
$("#logoutBtn").addEventListener("click", () => {
    showPage("dashboard");
});

// Sidebar and dashboard navigation
$$(".nav-link[data-page], .quick-action[data-page]")
    .forEach(button => {
        button.addEventListener("click", () => {
            showPage(button.dataset.page);
        });
    });

// Member search
$("#memberSearchForm").addEventListener("submit", event => {
    event.preventDefault();
    loadMembers($("#memberSearchInput").value.trim());
});

// Book search
$("#bookSearchForm").addEventListener("submit", event => {
    event.preventDefault();
    loadBooks($("#bookSearchInput").value.trim());
});

// Issue book
$("#issueBookForm").addEventListener("submit", async event => {
    event.preventDefault();
    hideNotice();

    const memberId = $("#issueMember").value;
    const bookId = $("#issueBook").value;
    const issueDate = $("#issueDate").value;
    const dueDate = $("#dueDate").value;

    if (!memberId || !bookId || !issueDate || !dueDate) {
        showNotice("Please complete all fields.", "error");
        return;
    }

    if (dueDate < issueDate) {
        showNotice(
            "Due date cannot be earlier than issue date.",
            "error"
        );
        return;
    }

    const button = $("#issueBookForm button[type='submit']");
    button.disabled = true;
    button.textContent = "Issuing...";

    try {
        const result = await LibraryAPI.issueBook(
            memberId,
            bookId,
            dueDate,
            issueDate
        );

        showNotice(
            result.message || "Book issued successfully.",
            "success"
        );

        $("#issueBookForm").reset();
        setDefaultDates();

        await loadIssueOptions();
        await loadDashboard();

    } catch (error) {
        showNotice(error.message, "error");
    } finally {
        button.disabled = false;
        button.innerHTML = "▣ &nbsp; Issue Book";
    }
});

// Mobile sidebar
$("#mobileMenuBtn").addEventListener("click", () => {
    $("#sidebar").classList.toggle("open");
});

document.addEventListener("click", event => {
    const sidebar = $("#sidebar");

    if (
        window.innerWidth <= 650 &&
        sidebar.classList.contains("open") &&
        !sidebar.contains(event.target) &&
        !$("#mobileMenuBtn").contains(event.target)
    ) {
        sidebar.classList.remove("open");
    }
});

// Initialize form dates
setDefaultDates();
showPage("dashboard");
