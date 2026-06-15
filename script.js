async function fetchUsers() {
  try {
    const response = await fetch(BASE_URL);
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.log(`This is the error: ${error}`);
  }
}

fetchUsers();
