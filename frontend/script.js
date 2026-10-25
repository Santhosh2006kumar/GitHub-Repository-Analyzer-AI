
const button = document.getElementById("analyzeButton");
const input = document.getElementById("githubUsername");
const statusMessage = document.getElementById("status");
const profileCard = document.getElementById("profileCard");



button.addEventListener("click", getProfile);




async function getProfile() {
    const username = input.value.trim();
    console.log("username displayed from getProfile: "+ username);
    localStorage.setItem("getusername",username); 
    if (!localStorage.getItem("getusername")) {
        statusMessage.textContent = "Please enter a GitHub username.";
        statusMessage.style.color="red";
        profileCard.hidden = true;
        document.getElementById("repositoriesSection").hidden= true; // newly added for f2
        document.getElementById("repositoryStatsSection").hidden = true // newly added for f3
        return;
    }
    
    button.disabled = true;
    statusMessage.textContent = "Loading GitHub profile...";
    profileCard.hidden = true;
    document.getElementById("repositoriesSection").hidden = true;//newly added... for f2
    document.getElementById("repositoryStatsSection").hidden = true; // newly addded for f3
    
    try {
        const response = await fetch(
            `http://127.0.0.1:8000/profile/${encodeURIComponent(localStorage.getItem("getusername"))}`
        );

        const data = await response.json();
        console.log(data)
        localStorage.setItem("profileData",JSON.stringify(data));
        
        
        if (!response.ok) {
            throw new Error(data.detail || "Unable to fetch profile.");
        }
        if(data.error) {
            statusMessage.textContent=data.error;
            statusMessage.style.color="red";
            console.log(data.error);
            return;
        };

        document.getElementById("avatar").src = data.avatar_url;
        document.getElementById("name").textContent =
            data.name || data.username;
        document.getElementById("username").textContent =
            "@" + data.username;
        document.getElementById("bio").textContent =
            data.bio || "No bio available.";
        document.getElementById("followers").textContent = data.followers;
        document.getElementById("following").textContent = data.following;
        document.getElementById("repositories").textContent =
            data.public_repos;
        document.getElementById("accountType").textContent = "Github "+ data.type;

        const profileLink = document.getElementById("profileLink");
        profileLink.href = data.profile_url;

        profileCard.hidden = false;
        statusMessage.textContent = "";

        await getRepositoryStats(localStorage.getItem("getusername")); // newly added for f3
        await getRepositories(localStorage.getItem("getusername")); // newly added for f2
        

    } catch (error) {
        statusMessage.textContent = error.message ||
            "Could not connect to the backend.";
    } finally {
        button.disabled = false;
    }
}



async function getRepositories(username) {
    const section = document.getElementById("repositoriesSection");
    const status = document.getElementById("repositoryStatus");
    const list = document.getElementById("repositoryList");

    section.hidden = false;
    status.textContent = "Loading repositories...";
    list.replaceChildren();

    try {
        const response = await fetch(
            `http://127.0.0.1:8000/repositories/${encodeURIComponent(username)}`
        );

        const data = await response.json();

        localStorage.setItem("repoData",JSON.stringify(data));
        console.log('LOCAL STORAGE REPOSITORY DATA:');
        console.log(localStorage.getItem("repoData"));

        if (!response.ok) {
            throw new Error(
                data.detail || "Could not load repositories."
            );
        }

        if (data.length === 0) {
            status.textContent = "No public repositories found.";
            status.style.color = "red";
            return;
        }

        for (const repo of data) {
            const card = document.createElement("article");
            card.className = "repository-card";

            const title = document.createElement("h3");
            const link = document.createElement("a");
            link.href = repo.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = repo.name;
            title.appendChild(link);

            const description = document.createElement("p");
            description.textContent =
                repo.description || "No description provided.";

            const details = document.createElement("p");
            details.textContent =
                `</>  ${repo.language || "Not specified"} | ` +
                `stars: ${repo.stars}`;

            const viewFilesLink = document.createElement("a");

            viewFilesLink.textContent = "View Files";
            viewFilesLink.className = "view-files-link";
            viewFilesLink.style.color= "white";

            console.log("username from getrepositories function"+localStorage.getItem("getuername"));
            
            viewFilesLink.href =
                `files.html?owner=${encodeURIComponent(localStorage.getItem("getusername"))}` +
                `&repo=${encodeURIComponent(repo.name)}`;

            card.append(title, description, details, viewFilesLink);

            card.append(title, description, details,viewFilesLink);
            list.appendChild(card);
        }

        status.textContent = `Found ${data.length} repositories.`;

    } catch (error) {
        status.textContent =
            error.message || "Could not connect to the backend.";
    }
}


async function getRepositoryStats(username) {
    const section = document.getElementById("repositoryStatsSection");
    const status = document.getElementById("repositoryStatsStatus");

    const totalRepositories = document.getElementById("totalRepositories");
    const totalStars = document.getElementById("totalStars");
    const mostUsedLanguage = document.getElementById("mostUsedLanguage");
    const mostStarredRepo = document.getElementById("mostStarredRepo");
    const mostStarredRepoStars = document.getElementById("mostStarredRepoStars");

    section.hidden = false;
    status.textContent = "Loading repository statistics...";

    try {
        const response = await fetch(
            `http://127.0.0.1:8000/repository-stats/${encodeURIComponent(username)}`
        );

        const data = await response.json();

        localStorage.setItem("repoStat",JSON.stringify(data));
        console.log('LOCAL STORAGE REPOSITORY STATISTICS:');
        console.log(localStorage.getItem("repoStat"));

        if (!response.ok) {
            throw new Error(
                data.detail || "Could not load repository statistics."
            );
        }

        totalRepositories.textContent = data.repo_count;
        totalStars.textContent = data.total_stars;
        mostUsedLanguage.textContent = data.most_used_language;

        if (data.most_starred_repo && data.most_starred_repo.name) {
            mostStarredRepo.textContent = data.most_starred_repo.name;

            mostStarredRepoStars.textContent =
                `Stars: ${data.most_starred_repo.stars}`;
        } else {
            mostStarredRepo.textContent = "No repositories found";
            mostStarredRepoStars.textContent = "Stars: 0";
        }

        status.textContent = "Repository statistics loaded successfully.";

    } catch (error) {
        status.textContent =
            error.message || "Could not connect to the backend.";
    }
}

//when the user comes back to the home page his data should be present in it . For  this from the file.html i will send 
// a query parameter like back=true and i will retrieve the data that is stored in local and i will display the previous data.


const params = new URLSearchParams(window.location.search);

if (params.get("back") === "true") {
    document.getElementById("githubUsername").value = localStorage.getItem("getusername");
    console.log(localStorage.getItem("getusername"));
    //displaying profile data
    const storedData = localStorage.getItem("profileData");

    if (storedData) {

        const data = JSON.parse(storedData);

        console.log("LOCAL STORAGE PROFILE DATA:", data);
        console.log(data.avatar_url);

        document.getElementById("avatar").src = data.avatar_url;

        document.getElementById("name").textContent =
            data.name || data.username;

        document.getElementById("username").textContent =
            "@" + data.username;

        document.getElementById("bio").textContent =
            data.bio || "No bio available.";

        document.getElementById("followers").textContent =
            data.followers;

        document.getElementById("following").textContent =
            data.following;

        document.getElementById("repositories").textContent =
            data.public_repos;

        document.getElementById("accountType").textContent =
            "GitHub " + data.type;

        const profileLink = document.getElementById("profileLink");
        profileLink.href = data.profile_url;

        profileCard.hidden = false;
        statusMessage.textContent = "";

    }
    //displaying repo stat
    const storedData2 = localStorage.getItem("repoStat");

    const totalRepositories = document.getElementById("totalRepositories");
    const totalStars = document.getElementById("totalStars");
    const mostUsedLanguage = document.getElementById("mostUsedLanguage");
    const mostStarredRepo = document.getElementById("mostStarredRepo");
    const mostStarredRepoStars = document.getElementById("mostStarredRepoStars");

    if (storedData2) {

        
        const data = JSON.parse(storedData2);
        totalRepositories.textContent = data.repo_count;
        totalStars.textContent = data.total_stars;
        mostUsedLanguage.textContent = data.most_used_language;

        if (data.most_starred_repo && data.most_starred_repo.name) {
            mostStarredRepo.textContent = data.most_starred_repo.name;

            mostStarredRepoStars.textContent =
                `Stars: ${data.most_starred_repo.stars}`;
        } else {
            mostStarredRepo.textContent = "No repositories found";
            mostStarredRepoStars.textContent = "Stars: 0";
        }

        document.getElementById("repositoryStatsSection").hidden=false;
        document.getElementById("repositoryStatsStatus").textContent = "Repository statistics loaded successfully.";

    }

    //displaying repository

    const storedData3 = localStorage.getItem("repoData");

    if(storedData3){
        const data = JSON.parse(storedData3);

        const section = document.getElementById("repositoriesSection");
        const status = document.getElementById("repositoryStatus");
        const list = document.getElementById("repositoryList");

        section.hidden = false;
        status.textContent = "Loading repositories...";
        list.replaceChildren();

        if (data.length === 0) {
            status.textContent = "No public repositories found.";
            status.style.color = "red";
            
        }

        for (const repo of data) {
            const card = document.createElement("article");
            card.className = "repository-card";

            const title = document.createElement("h3");
            const link = document.createElement("a");
            link.href = repo.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = repo.name;
            title.appendChild(link);

            const description = document.createElement("p");
            description.textContent =
                repo.description || "No description provided.";

            const details = document.createElement("p");
            details.textContent =
                `</>  ${repo.language || "Not specified"} | ` +
                `stars: ${repo.stars}`;

            const viewFilesLink = document.createElement("a");

            viewFilesLink.textContent = "View Files";
            viewFilesLink.className = "view-files-link";
            viewFilesLink.style.color= "white";
            
            viewFilesLink.href =
                `files.html?owner=${encodeURIComponent(localStorage.getItem("getusername"))}` +
                `&repo=${encodeURIComponent(repo.name)}`;

            card.append(title, description, details, viewFilesLink);

            card.append(title, description, details,viewFilesLink);
            list.appendChild(card);
        }

        status.textContent = `Found ${data.length} repositories.`;

    }
}
