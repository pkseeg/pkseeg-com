async function loadBlogIndex() {
    const res = await fetch('blogs/index.json');
    return await res.json();
}

async function renderFolderView(folderId) {
    const index = await loadBlogIndex();
    const folder = index.folders.find(f => f.id === folderId);
    const container = document.getElementById('blog-content');

    if (!folder) {
        container.innerHTML = '<p class="blog-error">folder not found.</p>';
        return;
    }

    document.getElementById('page-title').textContent = folder.label;
    document.title = `pkseeg — ${folder.label}`;

    const breadcrumb = `<div class="blog-breadcrumb"><a href="index.html">home</a> / <a href="blogs.html">writing</a> / ${folder.label}</div>`;

    if (folder.posts.length === 0) {
        container.innerHTML = breadcrumb + `<div class="blog-empty"><p>nothing here yet.</p></div>`;
        return;
    }

    container.innerHTML = breadcrumb + `<div class="blog-post-list">` +
        folder.posts.map(post => `
            <a href="blogs.html?folder=${folderId}&post=${post.id}" class="blog-post-item">
                <div class="blog-post-title">${post.title}</div>
                ${post.subtitle ? `<div class="blog-post-subtitle">${post.subtitle}</div>` : ''}
                <div class="blog-post-meta">${post.date}</div>
            </a>
        `).join('') +
    `</div>`;
}

async function renderPost(folderId, postId) {
    const index = await loadBlogIndex();
    const folder = index.folders.find(f => f.id === folderId);
    const folderLabel = folder ? folder.label : folderId.replace(/-/g, ' ');

    const container = document.getElementById('blog-content');

    try {
        const res = await fetch(`blogs/${folderId}/${postId}.md`);
        if (!res.ok) throw new Error('not found');
        const mdText = await res.text();

        const html = marked.parse(mdText);

        const breadcrumb = `<div class="blog-breadcrumb"><a href="index.html">home</a> / <a href="blogs.html">writing</a> / <a href="blogs.html?folder=${folderId}">${folderLabel}</a> / ${postId}</div>`;

        container.innerHTML = breadcrumb + `<div class="blog-post-body">${html}</div>`;

        // Fix relative image paths — markdown srcs resolve against blogs.html (root),
        // but assets sit alongside the .md file in blogs/<folder>/
        container.querySelectorAll('img').forEach(img => {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('http') && !src.startsWith('/')) {
                img.src = `blogs/${folderId}/${src}`;
            }
        });

        const h1 = container.querySelector('h1');
        if (h1) {
            document.title = `pkseeg — ${h1.textContent}`;
            document.getElementById('page-title').textContent = h1.textContent;
        }
    } catch (e) {
        container.innerHTML = '<p class="blog-error">post not found.</p>';
    }
}

async function renderAllFolders() {
    const index = await loadBlogIndex();
    const container = document.getElementById('blog-content');

    container.innerHTML = `<div class="blog-folders-page">` +
        index.folders.map(folder => `
            <a href="blogs.html?folder=${folder.id}" class="blog-folder-card">
                <span class="blog-folder-icon">📁</span>
                <span class="blog-folder-label">${folder.label}</span>
                <span class="blog-folder-count">${folder.posts.length} post${folder.posts.length !== 1 ? 's' : ''}</span>
            </a>
        `).join('') +
    `</div>`;
}

const params = new URLSearchParams(window.location.search);
const folder = params.get('folder');
const post = params.get('post');

if (folder && post) {
    renderPost(folder, post);
} else if (folder) {
    renderFolderView(folder);
} else {
    renderAllFolders();
}
