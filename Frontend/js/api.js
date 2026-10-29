const API_BASE = "http://localhost:8080/api";

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, options);

    if (!response.ok) {
        let message = `Request failed (${response.status})`;

        try {
            const error = await response.json();
            message = error.message || error.error || message;
        } catch {
            // Use the default message when the server returns no JSON.
        }

        throw new Error(message);
    }

    return response.json();
}

function searchQuery(search) {
    const value = String(search || "").trim();
    return value ? `?search=${encodeURIComponent(value)}` : "";
}

const LibraryAPI = {
    health() {
        return request("/health");
    },

    dashboard() {
        return request("/dashboard");
    },

    books(search = "") {
        return request(`/books${searchQuery(search)}`);
    },

    members(search = "") {
        return request(`/members${searchQuery(search)}`);
    },

    borrowings(memberId) {
        return request(`/members/${encodeURIComponent(memberId)}/borrowings`);
    },

    issueBook(memberId, bookId, dueDate, issueDate) {
        return request("/borrowings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                memberId,
                bookId,
                issueDate,
                dueDate
            })
        });
    }
};
