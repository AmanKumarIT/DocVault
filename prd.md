Product Requirements Document (PRD)
Document Storage & Viewer Web App
1. Project Overview
Product Name

DocVault Lite (working title)

Product Vision

A lightweight web-based document storage and viewing platform where users can:

Upload documents
Store them in cloud storage
Open documents directly in browser
Preview documents without downloading
Download files whenever needed

The system will use:

Supabase
 for cloud storage and database
A frontend-only architecture for simplicity and faster development
2. Core Objective

Build a simple document management system that:

Requires login/signup
Allows instant uploads
Supports in-browser viewing
Uses Supabase Storage for persistence
Supports multiple document formats
3. Key Features
3.1 Document Upload
Features
Upload files from device
Drag-and-drop upload
Multi-file upload
Upload progress bar
File validation
Supported File Types
Type	Extensions
PDF	.pdf
Word	.docx
PowerPoint	.pptx
Excel	.xlsx
Text	.txt
Images	.jpg, .png, .jpeg
Others	configurable
3.2 Cloud Storage
Storage Provider

Use:

Supabase Storage
Storage Flow
Frontend → Supabase Storage Bucket
Bucket Configuration

Recommended:

Public bucket for easier previewing

Alternative:

Private bucket + signed URLs
4. Document Viewer System
Main Requirement

Users must be able to:

Open files directly in browser
View documents without downloading
Navigate pages/slides
Zoom documents
Scroll documents
5. Supported Viewer Formats
File Type	Viewer Method
PDF	PDF.js
DOCX	docx-preview
PPTX	pptxjs
XLSX	SheetJS
TXT	Text renderer
Images	Native image viewer
6. Recommended Viewer Libraries
Purpose	Library
PDF Rendering	PDF.js

DOCX Rendering	docx-preview

Excel Rendering	SheetJS

PPTX Rendering	pptxjs
7. Download Feature
Requirements
Users can download uploaded documents
Download original file
Preserve original filename
8. Dashboard Requirements
Main Dashboard Features
File List

Display:

File name
File type
Upload date
File size
Actions
Open
Download
Delete
Optional Features
Search files
Filter by type
Sort by upload date
9. Functional Requirements
Upload Requirements
FR-1

Users can upload supported files.

FR-2

System validates:

File size
File type
FR-3

Files are stored in Supabase bucket.

Viewer Requirements
FR-4

Users can preview documents directly in browser.

FR-5

Viewer supports:

Zoom
Scroll
Slide/page navigation
FR-6

Viewer must support mobile responsiveness.

File Management Requirements
FR-7

Users can download files.

FR-8

Users can delete files.

FR-9

Users can search uploaded documents.

10. Non-Functional Requirements
Performance
Upload start response < 2 seconds
Preview load < 5 seconds
Lazy loading for large files
Scalability
Handle thousands of uploaded files
CDN-ready file delivery
Reliability
Prevent broken uploads
Retry failed uploads
Responsiveness
Desktop compatible
Tablet compatible
Mobile compatible
11. Tech Stack
Frontend (Recommended)
Technology	Purpose
Next.js	Frontend framework
TypeScript	Type safety
Pure CSS	Styling
Zustand/Context API	State management
Axios	Requests
Backend

No dedicated backend initially.

Use:

Supabase
 directly from frontend.
12. Supabase Integration
Services Used
Service	Usage
Storage	File storage
PostgreSQL	File metadata
Metadata Table
documents
documents
- id
- file_name
- file_type
- file_size
- storage_path
- uploaded_at
13. System Architecture
Frontend (Next.js)
        |
        |
 Supabase SDK
        |
-------------------------
| Storage | PostgreSQL |
-------------------------
14. User Flow
Upload Flow
User → Select File
      → Upload to Supabase Storage
      → Save Metadata
      → Display in Dashboard
View Flow
User → Click File
      → Open Viewer Component
      → Fetch File URL
      → Render in Browser
Download Flow
User → Click Download
      → Fetch File URL
      → Download Original File
15. UI/UX Requirements
Design Style
Minimal modern interface
Clean dashboard
Responsive layout
Smooth animations
Required Pages
Page	Purpose
Home	Main dashboard
Viewer	Document preview
Upload Modal	Upload interface
16. Security Considerations

Since authentication is removed, this becomes the biggest weakness of your app.

Major Problem

Anyone with access to:

Bucket URLs
Public endpoints

can potentially:

View files
Download files
Abuse storage
17. Recommended Security Strategy

Instead of completely public access:

Recommended Approach

Use:

Anonymous uploads
Private bucket
Signed temporary URLs

This gives:

Preview support
Controlled access
Better security
18. Important Technical Reality

Supporting true browser rendering for:

DOCX
PPTX
XLSX

is significantly harder than PDFs.

PDF preview is stable.
Office document rendering libraries are often:

Imperfect
Slow on large files
Formatting inconsistent

You should expect:

Some layout breakage
Partial rendering issues
Font inconsistencies
19. Recommended MVP Scope

Do NOT support everything initially.

Best MVP

Start with:

PDF
Images
TXT

Then add:

DOCX
PPTX
XLSX later

Otherwise debugging rendering libraries will consume most of your development time.

20. Recommended Folder Structure
src/
 ├── components/
 ├── viewers/
 ├── pages/
 ├── services/
 ├── hooks/
 ├── lib/
 ├── utils/
 └── styles/