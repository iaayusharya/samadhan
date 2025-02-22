const App = () => {
    const [applicantName, setApplicantName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [subject, setSubject] = React.useState("");
    const [issue, setIssue] = React.useState("");
    const [department, setDepartment] = React.useState("");
    const [issues, setIssues] = React.useState([]);
    const [adminIssues, setAdminIssues] = React.useState([]);
    const [generatedApplication, setGeneratedApplication] = React.useState("");
    const [loadingIssues, setLoadingIssues] = React.useState(true);
    const [loadingAdminIssues, setLoadingAdminIssues] = React.useState(true);
    const [error, setError] = React.useState("");
    const [infraIssues, setInfraIssues] = React.useState([]);
    const [loadingInfraIssues, setLoadingInfraIssues] = React.useState(true);

    const API_BASE_URL = "http://localhost:5000";

    // Utility function to handle API requests
    const fetchData = async (endpoint, setData, setLoading) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/${endpoint}`);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setData(data);
        } catch (error) {
            console.error(`Failed to fetch ${endpoint}:`, error);
            setError(`Failed to load ${endpoint.replace("-", " ")}. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    // Register Service Worker
    React.useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("service-worker.js")
                .then(() => console.log("Service Worker registered!"))
                .catch((err) => console.error("Service Worker registration failed:", err));
        }
    }, []);

    // Fetch issues from server
    React.useEffect(() => {
        fetchData("issues", setIssues, setLoadingIssues);
        fetchData("admin-issues", setAdminIssues, setLoadingAdminIssues);
        fetchData("infra-issues", setInfraIssues, setLoadingInfraIssues);
    }, []);

    // Handle application generation
    const handleGenerateApplication = async () => {
        if (!applicantName.trim() || !issue.trim() || !department.trim()) {
            alert("Please fill in all fields before generating the application.");
            return;
        }
    
        try {
            const response = await fetch(`${API_BASE_URL}/generate-application`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ applicantName, email, issue, department }),
            });
    
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
    
            const data = await response.json();
            setGeneratedApplication(data.application);
            setSubject(data.subject); // Update the subject state
            alert("Application generated successfully!");
        } catch (error) {
            console.error("Error generating application:", error);
            alert("Error generating application. Please try again.");
        }
    };

    // Handle issue submission
    const handleSubmit = async () => {
        if (!email.trim() || !issue.trim() || !generatedApplication.trim() || !subject.trim()) {
            alert("Please fill in all fields before submitting.");
            return;
        }
    
        try {
            const response = await fetch(`${API_BASE_URL}/submit-issue`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ applicantName, email, issue, department, application: generatedApplication, subject }),
            });
    
            if (!response.ok) {
                throw new Error(`Error ${response.status}: Issue submission failed`);
            }
    
            const result = await response.json();
            alert(result.message || "Issue submitted successfully!");
    
            // Device detection
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
            // Redirect based on device type
            if (isMobile) {
                window.location.href = result.mailtoURL; // Open email app on mobile
            } else {
                window.open(result.gmailURL, "_blank"); // Open Gmail in browser on desktop
            }
    
            // Clear fields after submission
            setApplicantName("");
            setEmail("");
            setIssue("");
            setDepartment("");
            setGeneratedApplication("");
            setSubject("");
        } catch (error) {
            console.error("Error submitting issue:", error);
            alert("Failed to submit issue. Please try again.");
        }
    };
    return (
        <div>
            <header style={{ background: "#007bff", color: "#fff", padding: "10px", textAlign: "center" }}>
                <h3>समाधान: एक नई शुरुआत</h3>
            </header>

            <main style={{ padding: "20px" }}>
                <section>
                    <h2>Report an Issue</h2>
                    {/* Applicant Name Input */}
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        required
                    />
                    <br /><br />
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <br /><br />
                    <textarea
                        placeholder="Describe your issue"
                        value={issue}
                        onChange={(e) => setIssue(e.target.value)}
                        required
                    ></textarea>
                    <br /><br />
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} required>
                        <option value="">Select Concerned Department</option>
                        <option value="Administration">Administration</option>
                        <option value="Examination">Examination</option>
                        <option value="Department of Students Welfare (DSW)">Department of Students Welfare (DSW)</option>
                        <option value="Library">Library</option>
                    </select>
                    <br /><br />
                    <button onClick={handleGenerateApplication}>Generate Application</button>
                </section>

                {generatedApplication && (
                    <section>
                        <h2>Generated Application</h2>
                        <textarea value={generatedApplication} rows="10" style={{ width: "100%" }} readOnly></textarea>
                        <br />
                        <button onClick={handleSubmit}>Submit Issue</button>
                        <button onClick={() => navigator.clipboard.writeText(generatedApplication)}>
                            📋 Copy to Clipboard
                        </button>
                    </section>
                )}

                {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

                <section id="admin-issues">
                    <h2>Administration Related Issues</h2>
                    <button onClick={() => fetchData("admin-issues", setAdminIssues, setLoadingAdminIssues)}>
                        Refresh Admin Issues
                    </button>
                    {loadingAdminIssues ? (
                        <p>Loading administration issues...</p>
                    ) : (
                        <ul>
                            {adminIssues.length > 0 ? (
                                adminIssues.map((issue, index) => <li key={index}>{issue}</li>)
                            ) : (
                                <li>No administration issues listed.</li>
                            )}
                        </ul>
                    )}
                </section>

                <section id="infra-issues">
                    <h2>Infrastructure Related Issues</h2>
                    <button onClick={() => fetchData("infra-issues", setInfraIssues, setLoadingInfraIssues)}>
                        Refresh Infra Issues
                    </button>
                    {loadingInfraIssues ? (
                        <p>Loading infrastructure issues...</p>
                    ) : (
                        <ul>
                            {infraIssues.length > 0 ? (
                                infraIssues.map((issue, index) => <li key={index}>{issue}</li>)
                            ) : (
                                <li>No infrastructure issues listed.</li>
                            )}
                        </ul>
                    )}
                </section>

                <section id="frequent-issues">
                    <h2>Reported Issues</h2>
                    <button onClick={() => fetchData("issues", setIssues, setLoadingIssues)}>
                        Refresh Reported Issues
                    </button>
                    {loadingIssues ? (
                        <p>Loading Frequent issues...</p>
                    ) : (
                        <ul>
                            {issues.length > 0 ? (
                                issues.map((issue, index) => (
                                    <li key={index}>
                                        {issue.issue} - {issue.department} - {issue.applicantName}
                                    </li>
                                ))
                            ) : (
                                <li>No Frequent issues reported yet.</li>
                            )}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    );
};

// Render React inside the root div
ReactDOM.render(<App />, document.getElementById("root"));

// Register Service Worker
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/service-worker.js")
            .then(reg => console.log("✅ Service Worker registered!", reg))
            .catch(err => console.error("❌ Service Worker registration failed!", err));
    });
}

// Install Prompt for PWA
let deferredPrompt;
window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;

    // Show install button (Ensure this button exists in your HTML)
    const installButton = document.getElementById("install-btn");
    if (installButton) {
        installButton.style.display = "block";

        installButton.addEventListener("click", () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(choice => {
                if (choice.outcome === "accepted") {
                    console.log("🎉 User installed the PWA!");
                } else {
                    console.log("❌ User dismissed the install prompt.");
                }
                deferredPrompt = null;
            });
        });
    }
});