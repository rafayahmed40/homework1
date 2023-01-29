import axios, { AxiosError } from "axios";

let port = 3000;
let host = "localhost";
let protocol = "http";
let baseUrl = `${protocol}://${host}:${port}`;


test("GET /books?id gets book by id", async () => {
    let id = "1";
    let { data } = await axios.get(`${baseUrl}/books?id=${id}`);
    let title = "My Fairest Lady"
    let resTitle = data['response'][0]['title']
    expect(title).toEqual(resTitle);


});


test("POST /books adds book to DB", async () => {
    let data = {
        author_id : "1",
        title : "New Book",
        pub_year : "1999",
        genre : "Horror"
    }

    let result = await axios.post(`${baseUrl}/books`, data);
    let newId = result.data.id;
    Object.assign(data, {'id': newId});
    let response = result.data.response;
    console.log(response);
    expect(response).toContainEqual(data);
})


test("DELETE /books/id deletes the book", async () => {
    let id = 1;
    let result = await axios.delete(`${baseUrl}/books/${id}`);
    let response = result.data.response;

    for (let i = 0; i < response.length; i++){
        expect(response[i]).not.toContain({id:1});
    }
    
})

