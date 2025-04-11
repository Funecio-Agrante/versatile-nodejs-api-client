//import fs from 'fs';
//import path from 'path';

import { APIManager } from './api.js';

const apiManager = new APIManager();
const postDetails = await apiManager.fetchAPIData('hive_post_comp', 
    { author: 'hiveio', permlink: 'around-the-hive-reflections' });

console.log('Title:', postDetails.result.title);
console.log('Cover image:', postDetails.result.json_metadata.image[0]);

apiManager.stopInterval();
