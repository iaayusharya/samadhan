const App = () => {
    const [email, setEmail] = React.useState("");
    const [issue, setIssue] = React.useState("");
    const [department, setDepartment] = React.useState("");
    const [issues, setIssues] = React.useState([]);
    const [generatedApplication, setGeneratedApplication] = React.useState("");

    // Register Service Worker & Handle Menu Toggle
    React.useEffect(() => {
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/samadhan/service-worker.js')
        .then((reg) => console.log("Service Worker registered!", reg))
        .catch((err) => console.error("Service Worker registration failed:", err));
    });
}


        const menuToggle = document.querySelector(".menu-toggle");
        if (menuToggle) {
            menuToggle.addEventListener("click", () => {
                document.querySelector("nav ul").classList.toggle("show");
            });
        }
    }, []);

    // Fetch issues from backend
    React.useEffect(() => {
        fetch("http://localhost:5000/issues")
            .then(response => response.json())
            .then(data => setIssues(data))
            .catch(error => console.error("❌ Error fetching issues:", error));
    }, []);

    // Generate Application
    const handleGenerateApplication = async () => {
        if (!issue.trim() || !department.trim()) {
            alert("⚠ Please describe your issue and select a department.");
            return;
        }

        try {
            console.log("🔍 Sending data to backend:", { issue, department });

            const response = await fetch("http://localhost:5000/generate-application", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ issue, department }),
            });

            if (!response.ok) {
                throw new Error(`Server Error: ${response.status}`);
            }

            const result = await response.json();
            if (result.application) {
                setGeneratedApplication(result.application);
            } else {
                alert("⚠ Failed to generate application.");
            }
        } catch (error) {
            console.error("❌ Error generating application:", error);
            alert("❌ Error generating application. Please try again.");
        }
    };

    // Submit Issue
    const handleSubmit = async () => {
        if (!email.trim() || !issue.trim() || !generatedApplication.trim()) {
            alert("⚠ Please fill in all fields before submitting.");
            return;
        }

        try {
            console.log("📤 Submitting issue:", { email, issue, generatedApplication, department });

            const response = await fetch("http://localhost:5000/submit-issue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, issue, application: generatedApplication, department }),
            });

            if (!response.ok) {
                throw new Error(`Server Error: ${response.status}`);
            }

            const result = await response.json();
            alert(result.message);

            // Refresh issues list
            fetch("http://localhost:5000/issues")
                .then(response => response.json())
                .then(data => setIssues(data));

            setEmail("");
            setIssue("");
            setDepartment("");
            setGeneratedApplication("");
        } catch (error) {
            console.error("❌ Error submitting issue:", error);
            alert("❌ Failed to submit issue. Please try again.");
        }
    };

    // Copy to Clipboard
    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedApplication).then(() => {
            alert("✅ Application copied to clipboard!");
        }).catch(err => console.error("❌ Error copying to clipboard:", err));
    };

    return (
        <div>
            <header style={{ background: "#007bff", color: "#fff", padding: "10px", textAlign: "center" }}>
                <h3>समाधान: एक नई शुरुआत</h3>
            </header>

            <main style={{ padding: "20px" }}>
                <section>
                    <h2>Report an Issue</h2>
                    <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <br /><br />
                    <textarea placeholder="Describe your issue" value={issue} onChange={(e) => setIssue(e.target.value)} required></textarea>
                    <br /><br />
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} required>
                        <option value="">Select Concerned Department</option>
                        <option value="Administration">Administration</option>
                        <option value="Examination">Examination</option>
                        <option value="Finance">Finance</option>
                        <option value="Library">Library</option>
                    </select>
                    <br /><br />
                    <button onClick={handleGenerateApplication}>Generate Application</button>
                </section>

                {generatedApplication && (
                    <section>
                        <h2>Generated Application</h2>
                        <textarea value={generatedApplication} onChange={(e) => setGeneratedApplication(e.target.value)} rows="10" style={{ width: "100%" }}></textarea>
                        <br />
                        <button onClick={copyToClipboard}>Copy to Clipboard</button>
                        <button onClick={handleSubmit}>Submit Issue</button>
                    </section>
                )}

                <section>
                    <h2>Frequent Issues</h2>
                    <ul>
                        {issues.length > 0 ? issues.map((item, index) => <li key={index}>{item.issue}</li>) : <li>No issues submitted yet.</li>}
                    </ul>
                </section>
            </main>
        </div>
    );
};

// Render React inside the root div
ReactDOM.render(<App />, document.getElementById("root"));
