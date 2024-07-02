# Voluntree Server

Voluntree is a secure, responsive platform connecting volunteers with opportunities through intuitive post management and search functionalities.

## Links

- [Live Website]([https://red-wave.netlify.app/](https://voluntree-go.netlify.app/))
- [Client Site Repository](https://github.com/abdul-muhaimin-toha/Voluntree-Client)
- [Server Site Repository](https://github.com/abdul-muhaimin-toha/Voluntree-Server)

## Run Locally

To run Red Wave locally, follow these steps:

```sh
npm install
npm run dev
```

## Key Features

#### Post Management:

- Users can create, edit, and delete posts if they are looking for volunteers.
- Posts contain information about the volunteer opportunity, such as title, description, location, and requirements.

#### Volunteer Applications:

- Users can apply to posts created by others if they want to work as volunteers.
- The Employee can see people who requested on their post, and accept or reject the request, and the data will be updated in every users states.
- Users can view posts they've applied to and manage their applications, including deleting or canceling them.

#### User Authentication and Registration:

- Users can register using their email or social media accounts.
- During registration, a random password is generated for enhanced security.

#### JWT Protection:

- The entire website is protected by JWT (JSON Web Tokens) authentication, ensuring secure access to protected routes and resources.

#### Post Viewing and Searching:

- Users can browse posts created by others to find volunteer opportunities.
- Posts can be viewed in either card or table format, with pagination available for ease of navigation.
- Users can search for posts based on their titles.

#### Responsive Design:

- The website is optimized for various devices, including mobile phones, tablets, and desktop computers.

#### Technology Stack:

Voluntree leverages a powerful technology stack to deliver its features:

- Backend: Node.js, Express.js, with jwt for handling server-side logic and API endpoints.
- Database: MongoDB for storing user data and post information.
- Frontend: React for building the user interface and providing a seamless browsing experience.

## NPM Packages used in this project

- Tanstack Query
- React Datepicker
- React Tabs
- Locomotive Scroll
- Axios
- React Helmet Async
- Json Web Token
- Firebase
- React Hook Form
- React Hot Toast
- Sweet Alert
- Swiper slider
