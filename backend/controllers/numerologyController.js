import NumerologyProfileSchema from "../models/numerologyProfile";

// List all profiles
export const listProfiles = async (req,res) => {
  const profiles = await NumerologyProfileSchema.find();
  res.json(profiles);
};

// Create new
export const createProfile = async (req,res) => {
  const profile = new NumerologyProfileSchema(req.body);
  await profile.save();
  res.status(201).json(profile);
};

// Update
export const updateProfile = async (req,res) => {
  const { id } = req.params;
  const profile = await NumerologyProfileSchema.findByIdAndUpdate(id, req.body, { new: true });
  if (!profile) return res.status(404).send('Not found');
  res.json(profile);
};

// Delete
export const deleteProfile = async (req,res) => {
  await NumerologyProfileSchema.findByIdAndDelete(req.params.id);
  res.status(204).end();
};


export const computeProfile = async (req, res) => {
  const { name, dob } = req.query;
  if (!name || !dob) {
    return res.status(400).json({ error: 'name and dob are required' });
  }

  // 1) Compute each core number
  const lifePath   = getLifePathNumber(dob);
  const expression = getExpressionNumber(name);
  const soulUrge   = getSoulUrgeNumber(name);
  const birthday   = getBirthdayNumber(dob);

  // 2) Lookup details from DB
  const types = {
    life_path:   lifePath,
    expression:  expression,
    soul_urge:   soulUrge,
    birthday:    birthday
  };

  // Fetch all at once
  const profiles = await NumerologyProfileSchema.find({
    type: { $in: Object.keys(types) },
    number: { $in: Object.values(types) }
  });

  // 3) Assemble response
  const result = Object.entries(types).map(([type, number]) => {
    const detail = profiles.find(p => p.type === type && p.number === number);
    return {
      type,
      number,
      ...(detail
        ? {
            title:       detail.title,
            description: detail.description,
            traits:      detail.traits,
            compatibility: detail.compatibility
          }
        : { title: null, description: null, traits: {}, compatibility: {} }
      )
    };
  });

  res.json({ status: 'ok', data: result });
};
