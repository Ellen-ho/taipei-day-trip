# Taipei-Day-Trip

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

<div align="center">
  <img width="100%" align="center" src="/static/images/trip_demo.png">
</div>

## About Taipei-Day-Trip

Taipei-Day-Trip is an e-commerce travel platform that makes it easy to explore Taipei’s attractions.By searching with MRT station name or entering keyword, users can swiftly locate points of interest across the city. Each attraction features a detailed description encompassing its historical significance, visitor information, and unique attributes, offering an in-depth understanding of each locale. Moreover, Taipei-Day-Trip provides a user-friendly online booking system, allowing users to book and purchase travel plans, facilitating a smooth travel experience.

<br>

<p align="center">
  <a href="https://travelco.agency/">Start Your Taipei Day Trip !</a>
</p>

## Test Account

| Email          | Password |
| -------------- | -------- |
| test@gmail.com | 123456   |

<br>

## Switch to the English Version

<div align="center">
  <img width="80%" align="center" src="/static/images/trip_en.png">
</div>

<br>

## Sign in and Sign up

<div align="center">
  <img width="80%" align="center" src="/static/images/signin_signup.png">
</div>

<br>

## Search for Attractions

<div align="center">
  <img width="80%" align="center" src="/static/images/attraction_search.png">
</div>

<br>

## Booking a Trip

<div align="center">
  <img width="80%" align="center" src="/static/images/booking.png">
</div>

<br>

## Complete the Purchase

<div align="center">
  <img width="80%" align="center" src="/static/images/order.png">
</div>

<br>

## Installation and Execution

- Clone the Project

```
git clone https://github.com/Ellen-ho/taipei-day-trip
```

- Navigate to the Project Directory

```
cd taipei-day-trip
```

- Install Dependencies

```
pip install -r requirements.txt
```

- Refer to the contents of .env.example, create a .env file, and populate it with the necessary variables.

- Initialize the Database

```
python db_setup.py
```

- Start the Application

```
uvicorn main:app --reload
```
