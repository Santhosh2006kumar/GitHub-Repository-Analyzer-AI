
const params = new URLSearchParams(window.location.search);

const owner = params.get("owner");
console.log(owner);
const repo = params.get("repo");

const repoTitle = document.getElementById("repoTitle");
const fileStatus = document.getElementById("fileStatus");
const fileList = document.getElementById("fileList");

// AI analysis elements
const analyzeAIButton = document.getElementById("analyzeAIButton");
const aiAnalysisSection = document.getElementById("aiAnalysisSection");
const aiAnalysisStatus = document.getElementById("aiAnalysisStatus");
const aiAnalysisResult = document.getElementById("aiAnalysisResult");

// Repository validation
if (!owner || !repo) {
    fileStatus.textContent = "Missing repository information.";
    analyzeAIButton.disabled = true;
} else {
    repoTitle.textContent = `${owner} / ${repo}`;
    loadFiles();
}

// Back navigation
const backLink = document.getElementById("backLink");
backLink.href = "index.html?back=true";

// Load repository files
async function loadFiles(path = "") {
    fileStatus.textContent = "Loading files...";
    fileList.replaceChildren();

    try {
        const url =
            `http://127.0.0.1:8000/repositories/` +
            `${encodeURIComponent(owner)}/` +
            `${encodeURIComponent(repo)}/files` +
            `?path=${encodeURIComponent(path)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Could not load files.");
        }

        if (data.length === 0) {
            fileStatus.textContent = "This folder is empty.";
            return;
        }

        for (const item of data) {
            const entry = document.createElement("button");
            entry.type = "button";
            entry.className = "file-entry";

            const isFolder = item.type === "dir";

            entry.textContent =
                `${isFolder ? "📂" : "📃"} ${item.name}`;

            if (isFolder) {
                entry.addEventListener("click", () => {
                    loadFiles(item.path);
                });
            } else {
                entry.addEventListener("click", () => {
                    window.open(
                        item.url,
                        "_blank",
                        "noopener,noreferrer"
                    );
                });
            }

            fileList.appendChild(entry);
        }

        fileStatus.textContent = `${data.length} item(s) found.`;

    } catch (error) {
        fileStatus.textContent =
            error.message || "Could not connect to the backend.";
    }
}

// Analyze repository using AI
analyzeAIButton.addEventListener("click", analyzeRepository);



async function analyzeRepository() {
    if (!owner || !repo) {
        aiAnalysisSection.hidden = false;
        aiAnalysisStatus.textContent =
            "Missing repository owner or name.";
        return;
    }

    aiAnalysisSection.hidden = false;
    aiAnalysisResult.replaceChildren();
    aiAnalysisStatus.textContent =
        "🤖 Analyzing repository with AI...";
    analyzeAIButton.disabled = true;

    try {
        const url =
            `http://127.0.0.1:8000/githubai/` +
            `${encodeURIComponent(owner)}/` +
            `${encodeURIComponent(repo)}`;

        const response = await fetch(url);

        const responseText = await response.text();

        let data;

        try {
            data = JSON.parse(responseText);
        } catch {
            data = responseText;
        }

        if (!response.ok) {
            throw new Error(
                typeof data === "object" && data !== null
                    ? data.detail || "AI analysis failed."
                    : `Request failed: ${response.status}`
            );
        }

        // Handle a JSON response wrapped inside a string
        if (typeof data === "string") {
            try {
                data = JSON.parse(data);
            } catch {
                aiAnalysisStatus.textContent =
                    "Analysis completed.";

                aiAnalysisResult.textContent = data;
                return;
            }
        }

        // Create a section heading
        function createHeading(text) {
            const heading = document.createElement("h3");
            heading.textContent = text;
            return heading;
        }

        // Create a paragraph
        function createParagraph(text) {
            const paragraph = document.createElement("p");
            paragraph.textContent = text;
            return paragraph;
        }

        // Create a list from an array
        function createList(items) {
            const list = document.createElement("ul");

            if (!Array.isArray(items) || items.length === 0) {
                const item = document.createElement("li");
                item.textContent = "No information available.";
                list.appendChild(item);
                return list;
            }

            items.forEach(value => {
                const item = document.createElement("li");

                item.textContent =
                    typeof value === "string"
                        ? value
                        : JSON.stringify(value);

                list.appendChild(item);
            });

            return list;
        }

        // Display warnings
        if (Array.isArray(data.warning) && data.warning.length > 0) {
            const warningSection = document.createElement("div");
            warningSection.className = "analysis-warning";

            const warning = createHeading("Warnings");
            warning.classList.add("ai-headings");
            warningSection.appendChild(warning);

            warningSection.appendChild(
                createList(data.warning)
            );

            aiAnalysisResult.appendChild(warningSection);
        }

        // Display project summary
        if (data.project_summary) {
            const proj_summary = createHeading("Project Summary");
            proj_summary.classList.add("ai-headings");
            aiAnalysisResult.appendChild(proj_summary);

            aiAnalysisResult.appendChild(
                createParagraph(data.project_summary)
            );
        }

        // Display tech stack
        if (data.tech_stack) {
            const tech_stack = createHeading("Tech Stack");
            tech_stack.classList.add("ai-headings");
            aiAnalysisResult.appendChild(tech_stack);

            const techStack = data.tech_stack;

            if (typeof techStack === "object" &&
                !Array.isArray(techStack)) {

                for (const [category, values] of
                    Object.entries(techStack)) {

                    aiAnalysisResult.appendChild(
                        createHeading(
                            category.replaceAll("_", " ")
                                .replace(/\b\w/g, char =>
                                    char.toUpperCase()
                                )
                        )
                    );

                    if (Array.isArray(values)) {
                        aiAnalysisResult.appendChild(
                            createList(values)
                        );
                    } else {
                        aiAnalysisResult.appendChild(
                            createParagraph(String(values))
                        );
                    }
                }
            } else {
                aiAnalysisResult.appendChild(
                    createParagraph(String(techStack))
                );
            }
        }

        // Display project structure
        if (data.file_structure) {
            const rfsheading = createHeading("Repository File Structure");
            rfsheading.classList.add("ai-headings");
            aiAnalysisResult.appendChild(rfsheading);

            const structure = document.createElement("pre");
            structure.className = "file-structure";
            structure.textContent =
                typeof data.file_structure === "string"
                    ? data.file_structure
                    : JSON.stringify(data.file_structure, null, 2);

            aiAnalysisResult.appendChild(structure);
        }

        // Display improvements
        if (data.improvements) {
            const sug_improvement = createHeading("Suggested Improvements");
            sug_improvement.classList.add("ai-headings");
            aiAnalysisResult.appendChild(sug_improvement);

            aiAnalysisResult.appendChild(
                Array.isArray(data.improvements)
                    ? createList(data.improvements)
                    : createParagraph(String(data.improvements))
            );
        }

        // Display next steps
        if (data.next_steps) {
            const next_step = createHeading("📝 Next Steps");
            next_step.classList.add("ai-headings");
            aiAnalysisResult.appendChild(next_step);

            aiAnalysisResult.appendChild(
                Array.isArray(data.next_steps)
                    ? createList(data.next_steps)
                    : createParagraph(String(data.next_steps))
            );
        }

        // Display any additional fields returned by the AI
        const knownFields = [
            "warning",
            "project_summary",
            "tech_stack",
            "file_structure",
            "improvements",
            "next_steps"
        ];

        const extraFields = Object.keys(data).filter(
            key => !knownFields.includes(key)
        );

        extraFields.forEach(key => {
            aiAnalysisResult.appendChild(
                createHeading(
                    key.replaceAll("_", " ")
                        .replace(/\b\w/g, char =>
                            char.toUpperCase()
                        )
                )
            );

            const value = data[key];

            if (Array.isArray(value)) {
                aiAnalysisResult.appendChild(createList(value));
            } else if (value !== null && typeof value === "object") {
                const pre = document.createElement("pre");
                pre.textContent = JSON.stringify(value, null, 2);
                aiAnalysisResult.appendChild(pre);
            } else {
                aiAnalysisResult.appendChild(
                    createParagraph(String(value ?? ""))
                );
            }
        });

        if (aiAnalysisResult.childElementCount === 0) {
            aiAnalysisResult.appendChild(
                createParagraph("The AI returned no analysis details.")
            );
        }

        aiAnalysisStatus.textContent =
            "Analysis completed successfully.";

    } catch (error) {
        aiAnalysisStatus.textContent =
            `❌ ${error.message || "Could not analyze repository."}`;
    } finally {
        analyzeAIButton.disabled = false;
    }
}

