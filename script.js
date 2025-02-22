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

    const API_BASE_URL = "https://samadhan-1pzu.onrender.com"; // Use HTTP for local development
    
    // Utility function to handle API requests
    const fetchData = async (endpoint, setData, setLoading) => {
        try {
            setLoading(true);
            console.log(`Fetching data from ${API_BASE_URL}/${endpoint}`); // Debugging
            const response = await fetch(`${API_BASE_URL}/${endpoint}`);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`Data fetched from ${endpoint}:`, data); // Debugging
            setData(data);
        } catch (error) {
            console.error(`Failed to fetch ${endpoint}:`, error);
            setError(`Failed to load ${endpoint.replace("-", " ")}. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

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
                <section id="issue-form">
                    <h2>Report an Issue</h2>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <textarea
                        placeholder="Describe your issue"
                        value={issue}
                        onChange={(e) => setIssue(e.target.value)}
                        required
                    ></textarea>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} required>
                        <option value="">Select Concerned Department</option>
                        <option value="Administration">Administration</option>
                        <option value="Examination">Examination</option>
                        <option value="Department of Students Welfare (DSW)">Department of Students Welfare (DSW)</option>
                        <option value="Library">Library</option>
                    </select>
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

                {/* Admin Issues Section */}
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

                {/* Infrastructure Issues Section */}
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

                {/* Frequent Issues Section */}
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

                {/* Gallery Section */}
                <section id="gallery">
                    <h2>Gallery</h2>
                    <div className="gallery-track">
                        <div className="gallery-item">
                            <img src="protest1.jpg" alt="Student Protest" />
                            <div className="caption">Student Protest at SVSU</div>
                        </div>
                        <div className="gallery-item">
                            <img src="letter1.jpeg" alt="Fees Exemption Letter" />
                            <div className="caption">Fees Exemption Letter</div>
                        </div>
                        <div className="gallery-item">
                            <img src="letter2.jpg" alt="Letter to Administration" />
                            <div className="caption">Letter to Administration</div>
                        </div>
                        <div className="gallery-item">
                            <video controls>
                                <source src="gathering1.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                            <div className="caption">Student Gathering</div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

// Lightbox functionality
const initializeLightbox = () => {
    const lightbox = document.getElementById("lightbox");
    const lightboxContent = document.getElementById("lightbox-content");
    const lightboxCaption = document.getElementById("lightbox-caption");
    const closeBtn = document.querySelector(".close");
    const prevBtn = document.querySelector(".prev");
    const nextBtn = document.querySelector(".next");

    let currentIndex = 0; // Track the current image/video index
    const galleryItems = document.querySelectorAll(".gallery-item");

    // Function to open the lightbox
    const openLightbox = (index) => {
        const item = galleryItems[index];
        const media = item.querySelector("img, video");
        const caption = item.querySelector(".caption").textContent;

        lightbox.style.display = "block";
        lightboxContent.innerHTML = media.outerHTML; // Set the content (image or video)
        lightboxCaption.textContent = caption;
        currentIndex = index;

        // Autoplay videos
        const video = lightboxContent.querySelector("video");
        if (video) {
            video.autoplay = true;
            video.controls = true; // Ensure controls are visible
        }
    };

    // Function to close the lightbox
    const closeLightbox = () => {
        // Pause videos when closing the lightbox
        const video = lightboxContent.querySelector("video");
        if (video) {
            video.pause();
        }
        lightbox.style.display = "none";
    };

    // Function to show the previous item
    const showPrevItem = () => {
        currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
        openLightbox(currentIndex);
    };

    // Function to show the next item
    const showNextItem = () => {
        currentIndex = (currentIndex + 1) % galleryItems.length;
        openLightbox(currentIndex);
    };

    // Add click event listeners to gallery items
    galleryItems.forEach((item, index) => {
        const media = item.querySelector("img, video");
        media.addEventListener("click", () => {
            openLightbox(index);
        });
    });

    // Close lightbox when clicking the close button
    closeBtn.addEventListener("click", closeLightbox);

    // Close lightbox when clicking outside the content
    lightbox.addEventListener("click", (e) => {
        if (e.target !== lightboxContent && e.target !== prevBtn && e.target !== nextBtn) {
            closeLightbox();
        }
    });

    // Navigate to previous item
    prevBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent lightbox from closing
        showPrevItem();
    });

    // Navigate to next item
    nextBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent lightbox from closing
        showNextItem();
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
        if (lightbox.style.display === "block") {
            if (e.key === "ArrowLeft") {
                showPrevItem();
            } else if (e.key === "ArrowRight") {
                showNextItem();
            } else if (e.key === "Escape") {
                closeLightbox();
            }
        }
    });
};

// Initialize lightbox after React renders the gallery
const initializeApp = () => {
    ReactDOM.render(<App />, document.getElementById("root"));
    initializeLightbox();
};

// Run the app
initializeApp();
