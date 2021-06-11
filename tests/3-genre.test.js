const request = require("supertest");
const app = require("../index");
const jwt = require("jsonwebtoken");

const { user, genre } = require("../models"); // import transaksi models

let authenticationToken = "0";
let tempID = "";

describe("Genre Feature TEST", () => {
  describe("/POST Create Genre", () => {
    test("It should insert new genre", async () => {
      // delete all user, do there were no duplicate admin
      await user.collection.dropIndexes();
      await user.deleteMany();      
      await user.collection.createIndex( { email: 1 } , { unique : true } );
      //create user admin
      const dataAdmin = {
        name: "Genres Users",
        email: "genre@test.com",
        password: "Pasword123!!",
        role: "admin",
      };

      let userData = await user.create(dataAdmin);
      const body = {
        id: userData._id,
        role: userData.role,
        email: userData.email,
      };

      //create token for auth as admin
      const token = jwt.sign(
        {
          user: body,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
        { algorithm: "RS256" }
      );
      // save token for later use
      authenticationToken = token;

      const res = await request(app)
        .post("/genre/create")
        .set({
          Authorization: `Bearer ${authenticationToken}`,
        })
        .send({
          genre: "newsss",
          main: "true",
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.message).toEqual("success");
      expect(res.body.data.genre).toEqual("newsss");
      expect(res.body.data.isMain).toEqual(true);
      //save id to be deleted later
      tempID = res.body.data._id;
    });
  });

  describe("/POST Create Genre Failed (name with symbol)", () => {
    test("It should return failed", async () => {
      const res = await request(app)
        .post("/genre/create")
        .set({
          Authorization: `Bearer ${authenticationToken}`,
        })
        .send({
          genre: "newsss///",
          main: "true",
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.message).toEqual("error");
      expect(res.body.error[0]).toEqual("genre must be alphanumeric");
    });
  });

  describe("/POST Create Genre Failed (main not boolean string)", () => {
    test("It should return failed", async () => {
      const res = await request(app)
        .post("/genre/create")
        .set({
          Authorization: `Bearer ${authenticationToken}`,
        })
        .send({
          genre: "newsss",
          main: "truefalse",
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.message).toEqual("error");
      expect(res.body.error[0]).toEqual("invalid main status");
    });
  });

  describe("/POST Create Genre Failed (genre data not passed)", () => {
    test("It should return failed", async () => {
      const res = await request(app)
        .post("/genre/create")
        .set({
          Authorization: `Bearer ${authenticationToken}`,
        })
        .send({
          //genre: "newsss",
          main: "true",
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.message).toEqual("error");
      expect(res.body.error[0]).toEqual("genre parameter not found");
    });
  });

  describe("/POST Create Genre Failed (main data not passed)", () => {
    test("It should return success with data main as false", async () => {
      const res = await request(app)
        .post("/genre/create")
        .set({
          Authorization: `Bearer ${authenticationToken}`,
        })
        .send({
          genre: "newsss3",
          //main: "truefalse",
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.message).toEqual("success");
      expect(res.body.data.isMain).toEqual(false);
    });
  });

  describe("/POST Create Genre Failed (login with User Token)", () => {
    test("It should return failed", async () => {
      const dataUser = {
        name: "Genres Users2",
        email: "genreUser@test.com",
        password: "Pasword123!!",
        role: "user",
      };
      let userData = await user.create(dataUser);
      const body = {
        id: userData._id,
        role: userData.role,
        email: userData.email,
      };
      //create token for auth as admin
      const token = jwt.sign(
        {
          user: body,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
        { algorithm: "RS256" }
      );

      const res = await request(app)
        .post("/genre/create")
        .set({
          Authorization: `Bearer ${token}`,
        })
        .send({
          genre: "newss",
          main: "true",
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.status).toEqual("Error");
      expect(res.body.message).toEqual("you are not Authorized");
    });
  });

  describe("/GET Main Genre Success", () => {
    test("It should return list of main genre", async () => {
      const res = await request(app)
        .get(`/genre/getMain`)
        .set({
          Authorization: `Bearer ${authenticationToken}`,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.message).toEqual("success");
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe("/PUT Update Genre", () => {
    test("It should update genre data", async () => {
      const res = await request(app)
        .put(`/genre/update/${tempID}`)
        .set({
          Authorization: `Bearer ${authenticationToken}`,
        })
        .send({
          genre: "newsss2",
          main: "false",
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.message).toEqual("success");
      expect(res.body.data.genre).toEqual("newsss2");
      expect(res.body.data.isMain).toEqual(false);
    });
  });

  describe("/PUT Update Genre failed invalid object id", () => {
    test("It should update genre data", async () => {
      const res = await request(app)
        .put(`/genre/update/09108afs`)
        .set({
          Authorization: `Bearer ${authenticationToken}`,
        })
        .send({
          genre: "newsss2",
          main: "false",
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.message).toEqual("error");
      expect(res.body.error[0]).toEqual("ID genre is not Valid");
    });
  });

  describe("/GET Main Genre Failed", () => {
    test("It should failed no Main genre found", async () => {
      const res = await request(app)
        .get(`/genre/getMain`)
        .set({
          Authorization: `Bearer ${authenticationToken}`,
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.message).toEqual("No Data Found");
      expect(res.body.data).toEqual(null);
    });
  });

  describe("/GET All Genre Success", () => {
    test("It should return list of all genre", async () => {
      const res = await request(app)
        .get(`/genre/getAll`)
        .set({
          Authorization: `Bearer ${authenticationToken}`,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.message).toEqual("success");
      expect(res.body.data[0].genre).toEqual("newsss2");
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe("/DELETE Genre Success", () => {
    test("It should delete selected genre", async () => {
      const res = await request(app)
        .delete(`/genre/delete/${tempID}`)
        .set({
          Authorization: `Bearer ${authenticationToken}`,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.message).toEqual("success");
    });
  });

  describe("/DELETE Genre Failed (invalid id)", () => {
    test("It should return failed because invalid id", async () => {
      const res = await request(app)
        .delete(`/genre/delete/` + 12412)
        .set({
          Authorization: `Bearer ${authenticationToken}`,
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.message).toEqual("error");
      expect(res.body.error[0]).toEqual("ID genre is not Valid");
    });
  });

  describe("/DELETE Genre Failed (genre not found)", () => {
    test("It should return failed because the id has been deleted previously", async () => {
      const res = await request(app)
        .delete(`/genre/delete/${tempID}`)
        .set({
          Authorization: `Bearer ${authenticationToken}`,
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.message).toEqual("Delete Failed");
    });
  });

  describe("/GET All Genre Failed", () => {
    test("It should return error because no data found", async () => {
      await genre.deleteMany();
      const res = await request(app)
        .get(`/genre/getAll`)
        .set({
          Authorization: `Bearer ${authenticationToken}`,
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.message).toEqual("No Data Found");
    });
  });
});
