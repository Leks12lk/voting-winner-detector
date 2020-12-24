import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

enum Approach {
  AbsoluteMajority = 'majority',
  Simpson = 'simpson'
}

interface ProfileRecord {
  count: number;
  results: string[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  currentDate = new Date();

  candidates = ['a', 'b', 'c', 'd'];
  approach: Approach | null = null;
  availableCandidates: string[] = [];
  selectedCandidates: string[] = [];
  profile: ProfileRecord[] = [];
  secondProfile: ProfileRecord[] = [];
  winnerText = '';

  form: FormGroup;
  get selectedCandidatesArray() {
    return this.form.get('selectedCandidates') as FormArray;
  }

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.availableCandidates = [...this.candidates];
    this.resetForm();
  }

  resetForm() {
    this.form = this.fb.group({
      selectedCandidates: new FormArray([
        new FormControl('', Validators.required),
        new FormControl('', Validators.required),
        new FormControl('', Validators.required),
        new FormControl('', Validators.required)
      ])
    });
  }

  vote() {
    if (!this.form.valid) {
      return;
    }

    this.availableCandidates = [...this.candidates];
    this.selectedCandidates = this.form.get('selectedCandidates').value;

    // build voting profile
    this.buildProfile();
  }

  isSelectedCandidate(candidate) {
    return this.form.get('selectedCandidates').value.indexOf(candidate) !== -1;
  }

  buildProfile() {
    if (this.selectedCandidates.length === 0) {
      return;
    }

    for (let i = 0; i < this.profile.length; i++) {
      const element = this.profile[i];
      const equal = this.arraysEqual(element.results, this.selectedCandidates);
      if (equal) {
        element.count += 1;
        return;
      }
    }

    this.profile.push({
      count: 1,
      results: this.selectedCandidates
    });
  }

  arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  approachChanged(approach) {
    this.approach = approach;
    this.winnerText = '';
  }

  calculate() {
    if (this.approach === Approach.AbsoluteMajority) {
      this.calculateByAbsoluteMajority();
    }

    if (this.approach === Approach.Simpson) {
      this.secondProfile = [];
      this.calculateBySimpson();
    }
  }

  calculateByAbsoluteMajority() {
    const profile = [...this.profile];

    let totalVotes = 0;
    profile.forEach(el => {
      totalVotes += el.count;
    });

    const winners = getWinnersObj(profile);

    const firstTourWinner = getAbsoluteWinner(winners);

    const isAbsoluteWinner = winners[firstTourWinner] > totalVotes / 2;

    if (isAbsoluteWinner) {
      this.winnerText = `Переможець за методом абсолютної більшості - кандидат '${firstTourWinner}' з кількістю голосів ${winners[firstTourWinner]}, що складає більше половині виборців`;
      return;
    }

    const secondWinners = { ...winners };
    delete secondWinners[firstTourWinner];

    const secondPlaceWinner = getAbsoluteWinner(secondWinners);

    const secondProfile = [...profile].map(el => {
      el.results = el.results.filter(x => x === firstTourWinner || x === secondPlaceWinner);
      return el;
    });

    this.secondProfile = secondProfile;

    const secondTourWinners = getWinnersObj(secondProfile);

    const absoluteWinner = getAbsoluteWinner(secondTourWinners);

    this.winnerText = `Переможець за методом абсолютної більшості у другому турі - кандидат '${absoluteWinner}' з кількістю голосів ${secondTourWinners[absoluteWinner]}`;

    function getWinnersObj(profile) {
      const winners = {};
      profile.forEach(el => {
        const winner = el.results[0];
        if (winners[winner]) {
          winners[winner] = winners[winner] + el.count;
        } else {
          winners[winner] = el.count;
        }
      });

      return winners;
    }

    function getAbsoluteWinner(winners) {
      const winner = Object.keys(winners).reduce((a, b) => {
        return winners[a] > winners[b] ? a : b;
      });
      return winner;
    }
  }

  calculateBySimpson() {
    const candidates = [...this.candidates];
    const profile = [...this.profile];

    const comparisonResult = {};
    for (let i = 0; i < candidates.length; i++) {
      const currentCandidate = candidates[i];

      let results = [];
      for (let j = 0; j < candidates.length; j++) {
        if (i === j) {
          continue;
        }

        let result = 0;
        const comparedCandidate = candidates[j];

        for (let k = 0; k < profile.length; k++) {
          const el = profile[k];
          if (el.results.indexOf(currentCandidate) < el.results.indexOf(comparedCandidate)) {
            result += el.count;
          }
        }
        results.push(result);

        comparisonResult[currentCandidate] = results;
      }
    }

    // find min
    const comparisonResult1 = {};
    for (const key in comparisonResult) {
      comparisonResult1[key] = Math.min(...comparisonResult[key]);
    }

    const winner = Object.keys(comparisonResult1).reduce((a, b) => {
      return comparisonResult1[a] > comparisonResult1[b] ? a : b;
    });

    this.winnerText = `Переможцем за методом Симпсона є кандидат '${winner}', оцінка Симпсона для якого складає ${comparisonResult1[winner]}`;
  }
}
