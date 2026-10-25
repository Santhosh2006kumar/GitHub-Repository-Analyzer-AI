from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import re
import json

from test import GitHubAnalyzerAI

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/profile/{username}")
def get_profile(username: str):
    url = f"https://api.github.com/users/{username}"

    response = requests.get(url)
    user = response.json()
    print(user)

    if response.status_code != 200:
        return {"error": "GitHub user not found"}

    return {
        "username": user["login"],
        "name": user["name"],
        "avatar_url": user["avatar_url"],
        "profile_url": user["html_url"],
        "type": user["type"],
        "bio": user["bio"],
        "followers": user["followers"],
        "following": user["following"],
        "public_repos": user["public_repos"]
    }



@app.get("/repositories/{username}")
def get_repositories(username: str):
    url = f"https://api.github.com/users/{username}/repos"

    try:
        response = requests.get(
            url,
            params={
                "per_page": 100,
                "sort": "updated"
            },
            timeout=10
        )
    except requests.RequestException:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to GitHub."
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=404,
            detail="GitHub user not found."
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail="Could not retrieve repositories."
        )

    repositories = response.json()

    return [
        {
            "name": repo["name"],
            "description": repo["description"],
            "language": repo["language"],
            "stars": repo["stargazers_count"],
            "url": repo["html_url"]
        }
        for repo in repositories
    ]

@app.get("/repository-stats/{username}")
def get_repository_stats(username: str):
    print(username)
    url = f"https://api.github.com/users/{username}/repos"

    try:
        response = requests.get(url,timeout=10)
    except requests.RequestException:
            raise HTTPException(
                status_code=502,
                detail="Could not connect to GitHub."
            )   
    if response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail="GitHub user not found."
            )
    
    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail="Could not retrieve repositories."
        )

    repositories = response.json()

    total_stars = 0
    repo_count = 0
    language_count = {}

    for repo in repositories:
          repo_count+=1
          total_stars+=repo["stargazers_count"]

          language = repo["language"]
          if language is not None:
            if language in language_count:
                language_count[language] += 1
            else:
                language_count[language] = 1

    if language_count:
        most_used_language = max(
            language_count, key=language_count.get
        )
    else:
        most_used_language = "No language data available"

    if repositories:
        most_starred_repo = max(
            repositories,
            key=lambda repo: repo["stargazers_count"]
        )

        repo_name = most_starred_repo["name"]
        repo_stars = most_starred_repo["stargazers_count"]
    else:
        repo_name = None
        repo_stars = 0

    return {
        "repo_count": repo_count,
        "total_stars": total_stars,
        "most_used_language": most_used_language,
        "most_starred_repo": {
            "name": repo_name,
            "stars": repo_stars
        }
    }



from urllib.parse import quote


@app.get("/repositories/{owner}/{repo}/files")
def get_repository_files(owner: str, repo: str, path: str = ""):
    # Build the GitHub API URL.
    url = f"https://api.github.com/repos/{owner}/{repo}/contents"

    # Add a folder path when the user opens a directory.
    if path:
        url += "/" + quote(path, safe="/")

    try:
        response = requests.get(url, timeout=10)
    except requests.RequestException:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to GitHub."
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=404,
            detail="Repository or folder not found."
        )

    if response.status_code == 403:
        raise HTTPException(
            status_code=429,
            detail="GitHub API rate limit reached. Try again later."
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail="Could not retrieve repository files."
        )

    items = response.json()

    # A folder returns a list; a single file returns an object.
    if not isinstance(items, list):
        items = [items]

    return [
        {
            "name": item["name"],
            "path": item["path"],
            "type": item["type"],
            "url": item["html_url"]
        }
        for item in items
    ]


@app.get("/githubai/{owner}/{repo}")
def GitHubAI(owner: str, repo: str):
    answer = GitHubAnalyzerAI(owner,repo)

    analysis_text = answer.strip()

    # Remove Markdown code fences if present
    analysis_text = re.sub(
        r"^```(?:json)?\s*|\s*```$",
        "",
        analysis_text,
        flags=re.IGNORECASE
    ).strip()

    # Convert JSON string into a Python dictionary
    analysis_data = json.loads(analysis_text)

    
    return analysis_data