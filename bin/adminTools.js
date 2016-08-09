#!/usr/bin/env node
'use strict';

const request = require('request');
const vorpal = require('vorpal');
const prettyjson = require('prettyjson');
const Pie = require('cli-pie');

const User = require('../model/user');

const PollBaseUrl = 'https://real-votes.herokuapp.com/api/poll/';
const VoteBaseUrl = 'https://real-votes.herokuapp.com/api/vote/';


console.log('Hello welcome to the real-votes admin console.');

const cli = vorpal();

cli
  .command('createPoll', 'Creates a new poll')
  .action(function(args, callback) {
    this.prompt([
      {
        type: 'input',
        name: 'pollName',
        message: 'What would you like to name your poll? ',
      },
      {
        type: 'input',
        name: 'choices',
        message: 'Please enter your choices for this poll: ',
      },
      {
        type: 'input',
        name: 'votesPerUser',
        message: 'Please enter your max votes for this poll: ',
      },
    ], (answers) => {
      const options = {
        url: PollBaseUrl,
        json: {
          pollName: answers.pollName,
          choices: answers.choices.split(','),
          votesPerUser: answers.votesPerUser,
        },
        auth: {
          username: 'admin',
          password: process.env.PASSWORD || 'password',
        },
      };

      request.post(options, (err) => {
        if (err) return this.log(err);
        this.log('Success!');
        callback();
      });
    });
  });

cli
  .command('updatePollStatus', 'Updates the status of a poll')
  .action(function(args, callback) {
    this.prompt([
      {
        type: 'input',
        name: 'id',
        message: 'Please enter the polls id you want to update: ',
      },
      {
        type: 'input',
        name: 'pollStatus',
        message: 'Please enter the status you want to set: ',
      },
    ], (answers) => {
      const options = {
        url: PollBaseUrl + answers.id,
        json: { pollStatus: answers.pollStatus },
        auth: {
          username: 'admin',
          password: process.env.PASSWORD,
        },
      };

      request.put(options, (err) => {
        if (err) return this.log(err);
        this.log('Success!');
        callback();
      });
    });
  });

cli
  .command('showAllPolls', 'Shows all polls')
  .action(function(args, callback) {
    request.get(PollBaseUrl, (err, res, body) => {
      if (err) return this.log(err);
      this.log(prettyjson.render(JSON.parse(body)));
      callback();
    });
  });

cli
  .command('showResults', 'Show the results of the current poll')
  .action(function(args, callback) {
    request.get(`${VoteBaseUrl}tally`, (err, res, body) => {
      if (err) return this.log(err);
      const results = JSON.parse(body);
      const chart = new Pie(10, [], { legend: true });

      Object.keys(results).forEach((key) => {
        chart.add({
          label: key,
          value: results[key],
        });
      });

      this.log(chart.toString());
      callback();
    });
  });

cli
  .delimiter('real-votes-admin$ ')
  .show();
