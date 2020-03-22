const BASE_URL = 'https://hack-or-snooze-v3.herokuapp.com';

/**
 * This class maintains the list of individual Story instances
 *  It also has some methods for fetching, adding, and removing stories
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /**
   * This method is designed to be called to generate a new StoryList.
   *  It:
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.*
   */

  // TODO: Note the presence of `static` keyword: this indicates that getStories
  // is **not** an instance method. Rather, it is a method that is called on the
  // class directly. Why doesn't it make sense for getStories to be an instance method?

  static async getStories() {
    //NOTES: I added try and catch
    try {
      // query the /stories endpoint (no auth required)
      const response = await axios.get(`${BASE_URL}/stories`);

      // turn the plain old story objects from the API into instances of the Story class
      const stories = response.data.stories.map(story => new Story(story));

      // build an instance of our own class using the new array of stories
      const storyList = new StoryList(stories);
      return storyList;
    } catch (e) {
      // throw an error
      alert(e.response.data.error.message);
      location.reload();
    }
  }

  /**
   * Method to make a POST request to /stories and add the new story to the list
   * - user - the current instance of User who will post the story
   * - newStory - a new story object for the API with title, author, and url
   *
   * Returns the new story object
   */

  async addStory(user, newStory) {
    // TODO - Implement this functions!
    // this function should return the newly created story so it can be used in
    // the script.js file where it will be appended to the DOM
    try {
      const res = await axios({
        method: 'POST',
        url: `${BASE_URL}/stories`,
        // NOTES: API FORMAT
        data: {
          token: user.loginToken,
          story: newStory
        }
      });

      // makes a story instance out of the story object
      newStory = new Story(res.data.story);

      // adds story to the front of the story list
      this.stories.unshift(newStory);

      // adds story to the front of user list

      this.ownStories.unshift(newStory);

      return newStory;
    } catch (e) {
      // NOTES: later add bootstrap modals instead of
      alert(e.response.data.error.message);
      location.reload();
    }
  }

  // Method that deletes story by making a DELETE request and updates the list

  // has to be user matched to ID

  async deleteStory(user, storyId) {
    try {
      await axios({
        url: `${BASE_URL}/stories/${storyId}`,
        method: 'DELETE',
        data: {
          token: user.loginToken
        }
      });

      // this filters out the story whose ID we are deleting
      this.stories = this.stories.filter(story => story.storyId !== storyId);

      //same for user list
      user.ownStories = user.ownStories.filter(s => s.storyId !== storyId);
    } catch (e) {
      alert(e.response.data.error.message);
      location.reload();
    }
  }
}

/**
 * The User class to primarily represent the current user.
 *  There are helper methods to signup (create), login, and getLoggedInUser
 */

class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;

    // these are all set to defaults, not passed in by the constructor
    this.loginToken = '';
    this.favorites = [];
    this.ownStories = [];
  }

  /* Create and return a new user.
   *
   * Makes POST request to API and returns newly-created user.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async create(username, password, name) {
    //NOTE: added try and catch
    try {
      const res = await axios.post(`${BASE_URL}/signup`, {
        user: {
          username,
          password,
          name
        }
      });

      // build a new User instance from the API response
      const newUser = new User(res.data.user);

      // attach the token to the newUser instance for convenience
      newUser.loginToken = res.data.token;

      return newUser;
    } catch (e) {
      alert(e.response.data.error.message);
      location.reload();
    }
  }

  /* Login in user and return user instance.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    // NOTE: added try and catch
    try {
      const res = await axios.post(`${BASE_URL}/login`, {
        user: {
          username,
          password
        }
      });

      // build a new User instance from the API response
      const existingUser = new User(res.data.user);

      // instantiate Story instances for the user's favorites and ownStories
      existingUser.favorites = res.data.user.favorites.map(s => new Story(s));
      existingUser.ownStories = res.data.user.stories.map(s => new Story(s));

      // attach the token to the newUser instance for convenience
      existingUser.loginToken = res.data.token;

      return existingUser;
    } catch (e) {
      // later want to add bootstrap modal or alert to display message
      alert(e.response.data.error.message);
      location.reload();
    }
  }

  /** Get user instance for the logged-in-user.
   *
   * This function uses the token & username to make an API request to get details
   *   about the user. Then it creates an instance of user with that info.
   */

  static async getLoggedInUser(token, username) {
    // if we don't have user info, return null
    if (!token || !username) return null;
    //NOTE: adde try and catch
    try {
      // call the API
      const res = await axios.get(`${BASE_URL}/users/${username}`, {
        params: {
          token
        }
      });

      // instantiate the user from the API information
      const existingUser = new User(res.data.user);

      // attach the token to the newUser instance for convenience
      existingUser.loginToken = token;

      // instantiate Story instances for the user's favorites and ownStories
      existingUser.favorites = res.data.user.favorites.map(s => new Story(s));
      existingUser.ownStories = res.data.user.stories.map(s => new Story(s));
      return existingUser;
    } catch (e) {
      alert(e.response.data.error.message);
      location.reload();
    }
  }

  // This function gets user data from API using a token.
  async retrieveData() {
    try {
      const res = await axios.get(`${BASE_URL}/users/${this.username}`, {
        params: {
          token: this.loginToken
        }
      });

      //updates all of users details with API response
      this.name = res.data.user.name;
      this.createdAt = res.data.user.createdAt;
      this.updatedAt = res.data.user.updatedAt;

      // this converts user favorites and ownStories into instances of Story
      this.favorites = res.data.user.favorites.map(s => new Story(s));
      this.ownStories = res.data.user.stories.map(s => new Story(s));

      return this;
    } catch (e) {
      alert(e.response.data.error.message);
      location.reload();
    }
  }
  //this adds a story to the list of the user favorites and updates based on story ID
  addFavorite(storyId) {
    return this._toggleFavorite(storyId, 'POST');
  }
  //this removes a story to from the user favorite lists based of story ID

  removeFavorite(storyId) {
    return this._toggleFavorite(storyId, 'DELETE');
  }

  //This is a helper method to either delete or post to the api.
  async _toggleFavorite(storyId, httpVerb) {
    try {
      await axios({
        url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
        method: httpVerb,
        data: {
          token: this.loginToken
        }
      });

      await this.retrieveData();
      return this;
    } catch (e) {
      alert(e.response.data.error.message);
      location.reload();
    }
  }

  // this sends a PATCH request to update the user

  static async update(userData) {
    try {
      const res = await axios({
        url: `${BASE_URL}/users/${this.username}`,
        method: 'PATCH',
        data: {
          user: userData,
          token: this.loginToken
        }
      });

      // name is really the only property you can update as stated in api doc files
      this.name = res.data.user.name;

      return this;
    } catch (e) {
      alert(e.response.data.error.message);
      location.reload();
    }
  }

  //this sends a delete request to remove user
  async remove() {
    try {
      await axios({
        url: `${BASE_URL}/users/${this.username}`,
        method: 'DELETE',
        data: {
          token: this.loginToken
        }
      });
    } catch (e) {
      alert(e.response.data.error.message);
      location.reload();
    }
  }
}

/**
 * Class to represent a single story.
 */

class Story {
  /**
   * The constructor is designed to take an object for better readability / flexibility
   * - storyObj: an object that has story properties in it
   */

  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }

  // this sends a PATCH request to update single story based off storyId
  async update(user, storyData) {
    try {
      const res = await axios({
        url: `${BASE_URL}/stories/${this.storyId}`,
        method: 'PATCH',
        data: {
          token: user.loginToken,
          story: storyData
        }
      });

      const { author, title, url, updatedAt } = res.data.story;

      // these are the only fields that you can change with a PATCH update

      this.author = author;
      this.title = title;
      this.url = url;
      this.updatedAt = updatedAt;

      return this;
    } catch (e) {
      alert(e.response.data.error.message);
      location.reload();
    }
  }
}
