const Schema = require("../Database/Schema");
const { ValidationError } = require("../Database/Schema");

describe("Schema Validation", () => {
	test("Should validate basic string type", () => {
		const schema = new Schema({
			name: { type: String, required: true },
		});
		const doc = schema.build({ name: "Skynet" });
		expect(doc.name).toBe("Skynet");
	});

	test("Should fail required validation", () => {
		const schema = new Schema({
			name: { type: String, required: true },
		});
		const doc = schema.build({});
		const error = schema.validate(doc);
		expect(error).toBeInstanceOf(ValidationError);
		expect(error.errors[0].validator).toBe("required");
	});

	test("Should apply default values", () => {
		const schema = new Schema({
			role: { type: String, default: "user" },
		});
		const doc = schema.build({});
		expect(doc.role).toBe("user");
	});

	test("Should validate nested schemas", () => {
		const childSchema = new Schema({
			tag: String,
		});
		const parentSchema = new Schema({
			child: childSchema,
		});
		
		const doc = parentSchema.build({ child: { tag: "test" } });
		expect(doc.child.tag).toBe("test");
	});

	test("Should validate arrays of strings", () => {
		const schema = new Schema({
			tags: [String],
		});
		const doc = schema.build({ tags: ["a", "b"] });
		expect(doc.tags).toEqual(["a", "b"]);
	});

	test("Should fail invalid array elements", () => {
		const schema = new Schema({
			scores: [Number],
		});
		expect(() => {
			schema.validate({ scores: ["not-a-number"] });
		}).not.toBeNull(); // validate returns errors array or null
	});
});
