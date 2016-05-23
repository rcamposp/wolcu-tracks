class CreateTracks < ActiveRecord::Migration
  def change
    create_table :tracks do |t|
      t.string :gpx
      t.string :name
      t.string :description

      t.timestamps null: false
    end
  end
end
