module.exports = function (grunt) {
  grunt.initConfig({
    pkgFile: 'package.json',
    'npm-contributors': {
      options: {
        commitMessage: 'chore: update contributors'
      }
    },
    bump: {
      options: {
        commitMessage: 'chore: release v%VERSION%',
        pushTo: 'upstream'
      }
    },
    eslint: {
      target: [
        'index.js',
        'gruntfile.js'
      ]
    }
  })

  require('load-grunt-tasks')(grunt)

  grunt.registerTask('default', ['eslint'])

  grunt.registerTask('release', 'Bump the version and publish to NPM.', function (type) {
    grunt.task.run([
      'npm-contributors',
      'bump:' + (type || 'patch'),
      'npm-publish'
    ])
  })
}
