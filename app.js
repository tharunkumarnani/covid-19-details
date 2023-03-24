const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("Server start running on localhost:3003");
    });
  } catch (e) {
    console.log(`Database Error ${e.message}`);
  }
};
initializeDBAndServer();
const convertCasing = (dbObj) => {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  };
};
// get all api
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    select * from state;`;
  const states = await db.all(getStatesQuery);
  const resStates = [];
  for (let each of states) {
    let eachRes = convertCasing(each);
    resStates.push(eachRes);
  }
  response.send(resStates);
});

// get by id api 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getStateByQuery = `
    select * from state where state_id=${stateId};`;
  const state = await db.get(getStateByQuery);
  const resState = convertCasing(state);
  response.send(resState);
});

// get district api3
const convertCasingDistricts = (dbObj) => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.curved,
    active: dbObj.active,
    deaths: dbObj.deaths,
  };
};
app.get("/districts/", async (request, response) => {
  //const { districtId } = request.params;
  const getDistrictsQuery = `
    select * from district;`;
  const districts = await db.all(getDistrictsQuery);
  //const resDistrict = convertCasingDistricts(district);
  response.send(districts);
});
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO 
    district (district_name,state_id,cases,cured,active,deaths)
    VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});
    `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});
//get district by Id api4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsQuery = `
    select * from district where district_id=${districtId};`;
  const district = await db.get(getDistrictsQuery);
  const resDistrict = convertCasingDistricts(district);
  response.send(resDistrict);
});

//delete district by id api 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsQuery = `
    delete from district where district_id=${districtId};`;
  const dbResponse = await db.run(getDistrictsQuery);

  response.send("District Removed");
});

// update district by id api 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  console.log(districtDetails);
  const updateDistrictQuery = `
    update 
        district 
    set 
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
    where district_id=${districtId} ;`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//get states stat by state id 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statesStatQuery = `
  select 
    sum(cases) as totalCases,
    sum(cured) as totalCured,
    sum(active) as totalActive,
    sum(deaths) as totalDeaths
    from state inner join district on state.state_id=district.state_id
    where state.state_id=${stateId};`;
  const dbResponse = await db.get(statesStatQuery);
  response.send(dbResponse);
});

//get district details api 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getByDistId = `
    select state_name
    from district inner join state on state.state_id=district.state_id
    where district.district_id=${districtId};`;
  const state = await db.get(getByDistId);

  response.send({ stateName: state.state_name });
});

module.exports = app;
