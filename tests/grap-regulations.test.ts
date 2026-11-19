import test from 'node:test';
import assert from 'node:assert/strict';
import { getGrapRegulation } from '../src/lib/grap-regulations.ts';

test('CAQM GRAP Regulations: Stage Threshold Evaluations', async (t) => {
  await t.test('evaluates AQI <= 200 as Below GRAP (NONE)', () => {
    const res50 = getGrapRegulation(50);
    assert.equal(res50.stage, 'NONE');
    assert.equal(res50.stageNumber, 0);

    const res200 = getGrapRegulation(200);
    assert.equal(res200.stage, 'NONE');
    assert.equal(res200.stageNumber, 0);
  });

  await t.test('evaluates AQI 201–300 as GRAP Stage I', () => {
    const res201 = getGrapRegulation(201);
    assert.equal(res201.stage, 'STAGE_1');
    assert.equal(res201.stageNumber, 1);
    assert.ok(res201.statutoryStatus.includes('Poor'));

    const res300 = getGrapRegulation(300);
    assert.equal(res300.stage, 'STAGE_1');
  });

  await t.test('evaluates AQI 301–400 as GRAP Stage II', () => {
    const res301 = getGrapRegulation(301);
    assert.equal(res301.stage, 'STAGE_2');
    assert.equal(res301.stageNumber, 2);
    assert.ok(res301.statutoryStatus.includes('Very Poor'));
    assert.ok(res301.citizenGuidelines.dont.some((d) => d.includes('diesel generators')));

    const res400 = getGrapRegulation(400);
    assert.equal(res400.stage, 'STAGE_2');
  });

  await t.test('evaluates AQI 401–450 as GRAP Stage III (BS-III Petrol & BS-IV Diesel ban)', () => {
    const res401 = getGrapRegulation(401);
    assert.equal(res401.stage, 'STAGE_3');
    assert.equal(res401.stageNumber, 3);
    assert.ok(res401.statutoryStatus.includes('Severe'));
    assert.ok(res401.vehicleRestrictions.some((v) => v.includes('BS-III Petrol and BS-IV Diesel')));
    assert.ok(res401.constructionRestrictions.some((c) => c.includes('ban on non-essential construction')));

    const res450 = getGrapRegulation(450);
    assert.equal(res450.stage, 'STAGE_3');
  });

  await t.test('evaluates AQI > 450 as GRAP Stage IV (Public Health Emergency & Truck bans)', () => {
    const res451 = getGrapRegulation(451);
    assert.equal(res451.stage, 'STAGE_4');
    assert.equal(res451.stageNumber, 4);
    assert.ok(res451.statutoryStatus.includes('Severe+ / Public Health Emergency'));
    assert.ok(res451.vehicleRestrictions.some((v) => v.includes('ban on entry of non-Delhi registered')));
    assert.ok(res451.schoolAdvisory.includes('Physical classes suspended'));
    assert.ok(res451.citizenGuidelines.do.some((g) => g.includes('work-from-home')));

    const res500 = getGrapRegulation(500);
    assert.equal(res500.stage, 'STAGE_4');
  });

  await t.test('handles boundary and non-finite AQI inputs safely', () => {
    const resNeg = getGrapRegulation(-20);
    assert.equal(resNeg.stage, 'NONE');

    const resNaN = getGrapRegulation(Number.NaN);
    assert.equal(resNaN.stage, 'NONE');

    const resOverflow = getGrapRegulation(999);
    assert.equal(resOverflow.stage, 'STAGE_4');
  });
});
