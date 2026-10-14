import { describe, expect, it } from "vitest";
import { calculateBudget, calculateMerit, filterAdmissions, type AdmissionRecord } from "@/lib/pakistan-hub";
const items: AdmissionRecord[] = [{ id:"1", institution:"Test University", city:"Lahore", province:"Punjab", degree:"BS", field:"Computing", sector:"Public", deadline:"Check official portal", tests:["ECAT"], eligibility:"Check", officialUrl:"https://example.com", sourceLabel:"Official", lastVerified:"Reference" }];
describe("Pakistan hub pure helpers", () => {
 it("calculates weighted merit and clamps inputs", () => { expect(calculateMerit(110, -5)).toBe(50); });
 it("calculates monthly and annual PKR totals", () => { expect(calculateBudget({tuition:100,hostel:50,transport:25,books:10,internet:15,applications:100,months:12})).toEqual({monthly:200,annual:2500}); });
 it("filters by province, sector and text", () => { expect(filterAdmissions(items,{province:"Punjab",city:"lah",degree:"All degrees",field:"comput",sector:"Public"})).toHaveLength(1); expect(filterAdmissions(items,{province:"Sindh",city:"",degree:"All degrees",field:"",sector:"All sectors"})).toHaveLength(0); });
});
